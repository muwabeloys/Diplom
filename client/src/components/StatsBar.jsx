import './StatsBar.css';

export default function StatsBar({ stats }) {
    const items = [
        { label: 'Всего слов', value: stats.total || 0, icon: '📚' },
        { label: 'Изучено', value: stats.learned || 0, icon: '✅' },
        { label: 'На сегодня', value: stats.due || 0, icon: '📅' },
    ];

    return (
        <div className="stats-bar">
            {items.map(({ label, value, icon }) => (
                <div key={label} className="stat-item">
                    <span className="stat-icon">{icon}</span>
                    <div className="stat-info">
                        <span className="stat-value">{value}</span>
                        <span className="stat-label">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}