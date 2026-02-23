import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FinancePoint {
    month: string;
    amount: number;
}

interface FinanceOverviewChartProps {
    data: FinancePoint[];
}

const FinanceOverviewChart: React.FC<FinanceOverviewChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="110%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#10B981' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorFin)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default FinanceOverviewChart;
