export default function MetricCard({ label, value, sublabel, Icon, accent = 'blue' }) {
  const accentStyles = {
    blue: { bg: 'bg-blue-50', text: 'text-accent', bar: 'bg-accent' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', bar: 'bg-teal-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
    navy: { bg: 'bg-navy-900/5', text: 'text-navy-900', bar: 'bg-navy-900' },
  };
  const styles = accentStyles[accent];

  return (
    <div className="group relative bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(30,42,90,0.08)] overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.bar}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">{label}</p>
          {Icon && (
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${styles.bg} ${styles.text} transition-transform duration-200 group-hover:scale-110`}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
        </div>
        <p className="text-2xl font-semibold text-navy-900">{value}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}
