import React, { useEffect, useMemo, useRef, useState } from 'react';

interface FinancePoint {
    month: string;
    amount: number;
}

interface FinanceOverviewChartProps {
    data: FinancePoint[];
}

const FinanceOverviewChart: React.FC<FinanceOverviewChartProps> = ({ data }) => {
    const safeData = data.length > 0 ? data : [{ month: 'Hoje', amount: 0 }];
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [chartSize, setChartSize] = useState({ width: 0, height: 120 });
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateSize = () => {
            const width = Math.max(0, Math.floor(el.clientWidth));
            const height = Math.max(120, Math.floor(el.clientHeight || 120));
            setChartSize({ width, height });
        };

        updateSize();

        const observer = new ResizeObserver(() => updateSize());
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    const chartGeometry = useMemo(() => {
        const width = chartSize.width;
        const height = chartSize.height;

        if (width <= 0 || height <= 0) return null;

        const padding = {
            top: 10,
            right: 6,
            bottom: 24,
            left: 6
        };
        const innerWidth = Math.max(1, width - padding.left - padding.right);
        const innerHeight = Math.max(1, height - padding.top - padding.bottom);
        const maxAmount = Math.max(...safeData.map((point) => point.amount), 1);
        const stepX = safeData.length > 1 ? innerWidth / (safeData.length - 1) : innerWidth / 2;

        const points = safeData.map((point, index) => {
            const x = padding.left + (safeData.length === 1 ? innerWidth / 2 : stepX * index);
            const y = padding.top + innerHeight - ((point.amount / maxAmount) * innerHeight);
            return { ...point, x, y };
        });

        const linePath = points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

        return {
            points,
            padding,
            innerHeight,
            areaPath,
            linePath
        };
    }, [chartSize.height, chartSize.width, safeData]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[120px] min-w-0 relative">
            {chartGeometry && (
                <>
                    <svg width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="block w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="financeAreaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.04} />
                            </linearGradient>
                        </defs>

                        <path
                            d={chartGeometry.areaPath}
                            fill="url(#financeAreaFill)"
                        />
                        <path
                            d={chartGeometry.linePath}
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {chartGeometry.points.map((point, index) => (
                            <g key={`${point.month}-${index}`}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={activeIndex === index ? 5 : 3.5}
                                    fill="#10B981"
                                    stroke="rgba(15,23,42,0.9)"
                                    strokeWidth="2"
                                    className="cursor-pointer transition-all"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                />
                                <text
                                    x={point.x}
                                    y={chartSize.height - 6}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#64748b"
                                >
                                    {point.month}
                                </text>
                            </g>
                        ))}
                    </svg>

                    {activeIndex !== null && chartGeometry.points[activeIndex] && (
                        <div className="absolute top-2 right-2 rounded-xl border border-white/10 bg-[rgba(15,23,42,0.92)] px-3 py-2 text-white shadow-lg pointer-events-none">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                                {chartGeometry.points[activeIndex].month}
                            </p>
                            <p className="text-sm font-black text-emerald-400">
                                R$ {chartGeometry.points[activeIndex].amount.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FinanceOverviewChart;
