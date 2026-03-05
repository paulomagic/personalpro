import { supabase } from '../../supabaseCore';

const STORAGE_BUCKET = 'assessment-photos';

function compressImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');

                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export async function uploadAvatar(
    file: File,
    _coachId: string,
    _clientId: string = 'new'
): Promise<string | null> {
    try {
        return await compressImageToDataUrl(file, 200, 0.8);
    } catch (error) {
        console.error('[uploadAvatar] Error processing image:', error);
        return null;
    }
}

export async function uploadAssessmentPhoto(
    file: File,
    clientId: string,
    coachId: string
): Promise<string | null> {
    if (!supabase) {
        console.warn('Supabase not configured - photo upload skipped');
        return null;
    }

    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `${coachId}/${clientId}/${timestamp}.${extension}`;

        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading photo:', error.message);
            if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
                return 'https://ui-avatars.com/api/?name=Photo&background=3b82f6&color=fff&size=400';
            }
            return null;
        }

        const { data: signedData, error: signedError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(data.path, 60 * 60 * 24 * 7);

        if (signedError) {
            console.error('Error creating signed URL:', signedError.message);
            return null;
        }

        return signedData.signedUrl;
    } catch (error) {
        console.error('Error in uploadAssessmentPhoto:', error);
        return null;
    }
}
