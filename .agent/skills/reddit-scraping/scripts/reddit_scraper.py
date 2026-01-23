import requests
import sys
import argparse

def get_posts(subreddit, sort_by='hot', time_filter='all', limit=3):
    """
    Fetches posts from the specified subreddit with sorting and time filtering.
    """
    # Construct base URL based on sort type
    if sort_by not in ['hot', 'new', 'top', 'rising', 'controversial']:
        print(f"Invalid sort option: {sort_by}. Defaulting to 'hot'.")
        sort_by = 'hot'

    url = f"https://www.reddit.com/r/{subreddit}/{sort_by}.json?limit={limit}"
    
    # Add time filter if applicable (top or controversial)
    if sort_by in ['top', 'controversial']:
        url += f"&t={time_filter}"

    # User-Agent is important to avoid 429 Too Many Requests errors
    headers = {'User-Agent': 'python:reddit_scraper:v1.1 (by /u/antigravity)'}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        posts = data['data']['children']
        
        print(f"--- Top {limit} '{sort_by}' Posts in r/{subreddit} (Time: {time_filter}) ---\n")
        
        if not posts:
            print("No posts found.")
            return

        for i, post in enumerate(posts, 1):
            post_data = post['data']
            title = post_data.get('title', 'No Title')
            post_url = post_data.get('url', 'No URL')
            score = post_data.get('score', 0)
            
            print(f"{i}. {title}")
            print(f"   Score: {score}")
            print(f"   URL: {post_url}")
            print("-" * 40)
            
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Reddit: {e}")
    except KeyError:
        print("Error parsing JSON response. The subreddit might not exist or the structure has changed.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape Reddit posts.')
    parser.add_argument('subreddit', nargs='?', default='n8n', help='Subreddit to scrape')
    parser.add_argument('--sort', choices=['hot', 'new', 'top', 'rising', 'controversial'], default='hot', help='Sort order')
    parser.add_argument('--time', choices=['hour', 'day', 'week', 'month', 'year', 'all'], default='all', help='Time filter (for top/controversial)')
    parser.add_argument('--limit', type=int, default=3, help='Number of posts to retrieve')

    args = parser.parse_args()
    
    get_posts(args.subreddit, args.sort, args.time, args.limit)
