import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip } from 'recharts';

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

    return (
        <div ref={containerRef} className="w-full h-full min-h-[120px] min-w-0">
            {chartSize.width > 0 && (
                <AreaChart
                    width={chartSize.width}
                    height={chartSize.height}
                    data={safeData}
                    margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="financeAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        dy={8}
                    />
                    <Tooltip
                        cursor={{ stroke: 'rgba(16,185,129,0.2)' }}
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                        }}
                        itemStyle={{ color: '#10B981' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#financeAreaFill)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            )}
        </div>
    );
};

export default FinanceOverviewChart;
