import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { ListTodo, Activity, Calendar, Building, TrendingUp, Layers } from 'lucide-react';
import type { TaskRecord } from './types';
import './index.css';

const formatPeriod = (p: string) => {
  if (!p || p.length !== 6) return p;
  const year = p.substring(2, 4);
  const monthNum = parseInt(p.substring(4, 6), 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${months[monthNum - 1]} '${year}`;
  }
  return p;
};

const getFinancialYear = (periodStr: string): string | null => {
  if (!periodStr || periodStr.length !== 6) return null;
  const year = parseInt(periodStr.substring(0, 4), 10);
  const month = parseInt(periodStr.substring(4, 6), 10);

  if (month >= 7 && month <= 12) {
    return `FY ${year}/${(year + 1).toString().substring(2)}`;
  } else if (month >= 1 && month <= 6) {
    return `FY ${year - 1}/${year.toString().substring(2)}`;
  }
  return null;
};

function parseCSV(text: string): any[] {
  const lines: string[][] = [];
  let row = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  
  if (lines.length === 0) return [];
  const headers = lines[0];
  const results = [];
  for (let j = 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.length < headers.length) continue;
    const obj: any = {};
    for (let k = 0; k < headers.length; k++) {
      obj[headers[k].trim()] = line[k]?.trim();
    }
    results.push(obj);
  }
  return results;
}

const COLORS = [
  '#764393', // Primary Purple
  '#5E3676', // Deep Purple
  '#7D2882', // Orchid Purple
  '#472858', // Dark Plum Purple
  '#9174A8', // Medium Lavender Purple
  '#D5C5DE', // Light Pastel Purple
  '#F1ECF4', // Soft White-Purple
  '#82754B', // Primary Gold
  '#9D8C5F', // Dark Olive Gold
  '#B3A47A', // Medium Antique Gold
  '#DDD2AD', // Light Soft Gold
  '#78D092', // Emerald Accent
  '#B6D984', // Lime Accent
  '#78D2D7', // Teal Accent
  '#71C2F5', // Soft Blue Accent
  '#EF8C6D', // Coral Orange Accent
  '#F0B67D', // Peach Accent
  '#F4D37C', // Yellow Gold Accent
  '#FFB8E4', // Soft Pink Accent
];

const TASK_TYPE_COLORS: Record<string, string> = {
  'Website Update': '#764393',            // Specified by user: Primary Purple
  'Graphic Design': '#82754B',            // Specified by user: Primary Gold
  'CUHK Visuals': '#9174A8',              // Specified by user: Medium Lavender Purple
  'Website Development': '#5E3676',       // Deep Purple
  'Data Intelligence': '#7D2882',         // Orchid Purple
  'Digital Asset Management': '#472858',  // Dark Plum Purple
  'Event Support': '#78D092',             // Emerald Accent
  'Liana/eDM': '#B6D984',                 // Lime Accent
  'Mailing': '#78D2D7',                   // Teal Accent
  'Photo Searching': '#71C2F5',           // Soft Blue Accent
  'Photography': '#EF8C6D',               // Coral Orange Accent
  'Productivity System': '#F0B67D',       // Peach Accent
  'Research': '#F4D37C',                  // Yellow Gold Accent
  'Tech Support': '#FFB8E4',              // Soft Pink Accent
};

const EFFORT_LEVELS: Record<string, string> = {
  'Website Update': '7/10',
  'Graphic Design': '10/10',
  'CUHK Visuals': '8/10',
  'Data Intelligence': '8/10',
  'Productivity System': '9/10',
  'Digital Asset Management': '7/10',
  'Tech Support': '7/10',
  'Mailing': '3/10',
  'Photography': '9/10',
  'Event Support': '4/10',
  'Website Development': '10/10',
  'Research': '6/10',
  'Photo Searching': '5/10',
};

const DEPT_GROUP_COLORS: Record<string, string> = {
  'CPR Digital & Creative': '#764393', // Primary Purple
  'CPRO OTHER TEAMS': '#82754B',       // Primary Gold
  'OTHERS': '#78D2D7',                 // Teal Accent
};

const getTaskTypeColor = (type: string, index: number) => {
  return TASK_TYPE_COLORS[type] || COLORS[index % COLORS.length];
};

const renderCustomPieLabel = ({ cx, cy, midAngle, outerRadius, percent, value, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20; // Render outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#333333"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      {name}: {value} ({(percent * 100).toFixed(1)}%)
    </text>
  );
};

const CustomizedAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const value = payload.value || '';

  const words = value.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word: string) => {
    if ((currentLine + ' ' + word).trim().length > 18) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="#333333"
        style={{ fontSize: 9.5, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
      >
        {lines.map((line, index) => (
          <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// Customized Tooltip to calculate and display the TOTAL, category totals, and sub-group splits on hover
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

    return (
      <div
        className="glass-panel"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid rgba(118, 67, 147, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 10px 30px 0 rgba(118, 67, 147, 0.1)',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '0.85rem',
          color: '#222222',
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#764393', fontSize: '0.95rem' }}>
          {label}
        </p>
        <p style={{ fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid rgba(118, 67, 147, 0.15)', paddingBottom: '0.4rem', fontSize: '0.9rem' }}>
          Total Projects: <span style={{ color: '#764393', fontSize: '1.1rem', fontWeight: 800 }}>{total}</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null;

            // Retrieve splits for this task type from the hovered month's payload
            const splits = entry.payload?._splits?.[entry.name];
            const hasSplits = splits && (splits.dc > 0 || splits.exceptDC > 0);

            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <p style={{ display: 'flex', justifyContent: 'space-between', gap: '2.5rem', fontWeight: 700, color: '#222222' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></span>
                    {entry.name}:
                  </span>
                  <span>{entry.value}</span>
                </p>
                {hasSplits && (
                  <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.05rem', color: '#555555', fontSize: '0.8rem', fontWeight: 500 }}>
                    {splits.dc > 0 && (
                      <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• DC ONLY:</span>
                        <span style={{ fontWeight: 600 }}>{splits.dc}</span>
                      </p>
                    )}
                    {splits.exceptDC > 0 && (
                      <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Except DC:</span>
                        <span style={{ fontWeight: 600 }}>{splits.exceptDC}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

function App() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeline, setSelectedTimeline] = useState<string>('All');

  // Comparison years selection states
  const [compareYearA, setCompareYearA] = useState<string>('FY 2024/25');
  const [compareYearB, setCompareYearB] = useState<string>('FY 2025/26');

  // Table filters selection states
  const [filterName, setFilterName] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterPeriod, setFilterPeriod] = useState<string>('All');

  // Chart toggle states
  const [excludeCPR, setExcludeCPR] = useState<boolean>(false);

  useEffect(() => {
    // If not localhost, or if local fetch fails, fetch directly from Google Sheet CSV
    const SHEET_ID = '10QwbD_iQuL2iL4HAkhZ61uAIiXcvSOT6j1EcswRO-lY';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

    const fetchDirectly = () => {
      fetch(CSV_URL)
        .then((res) => res.text())
        .then((text) => {
          const parsed = parseCSV(text);
          if (parsed && parsed.length > 0) {
            setTasks(parsed);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching directly from Google Sheet:', err);
          setLoading(false);
        });
    };

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetch('http://localhost:3001/api/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setTasks(data.data);
            setLoading(false);
          } else {
            fetchDirectly();
          }
        })
        .catch((err) => {
          console.warn('Backend connection failed, falling back to direct Google Sheet fetch:', err);
          fetchDirectly();
        });
    } else {
      fetchDirectly();
    }
  }, []);

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Exclude cancelled tasks
      const s = t.Status?.trim().toLowerCase();
      if (s === 'cancel' || s === 'cancelled' || s === 'canceled') {
        return false;
      }

      // 2. Filter out tasks where Task type is null/empty/blank/null string
      const type = t['Task type']?.trim();
      if (!type || type === '' || type.toLowerCase() === 'null') {
        return false;
      }

      // 3. Filter out tasks where Department/Office is null/empty/blank/null string
      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim();
      if (!dept || dept === '' || dept.toLowerCase() === 'null') {
        return false;
      }

      return true;
    });
  }, [tasks]);

  const filteredActiveTasksByCPR = useMemo(() => {
    return activeTasks.filter((t) => {
      if (!excludeCPR) return true;
      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
      const isCPR = dept.toLowerCase() === 'cpr digital & creative' || (t['Dpt/ Office'] || '').trim().toLowerCase() === 'cpr digital & creative';
      return !isCPR;
    });
  }, [activeTasks, excludeCPR]);

  const availableFinancialYears = useMemo(() => {
    const fySet = new Set<string>();
    activeTasks.forEach((t) => {
      const p = t.Period?.trim();
      const fy = getFinancialYear(p);
      if (fy) {
        fySet.add(fy);
      }
    });
    return ['All', ...Array.from(fySet).sort()];
  }, [activeTasks]);

  // List of all active Financial Years for the comparison select boxes
  const comparisonYearsList = useMemo(() => {
    const list = availableFinancialYears.filter((fy) => fy !== 'All');
    return list;
  }, [availableFinancialYears]);

  // Auto-set comparison defaults once active list is parsed
  useEffect(() => {
    if (comparisonYearsList.length >= 2) {
      setCompareYearA(comparisonYearsList[comparisonYearsList.length - 2]);
      setCompareYearB(comparisonYearsList[comparisonYearsList.length - 1]);
    } else if (comparisonYearsList.length === 1) {
      setCompareYearA(comparisonYearsList[0]);
      setCompareYearB(comparisonYearsList[0]);
    }
  }, [comparisonYearsList]);

  const availableTaskTypes = useMemo(() => {
    const types = new Set<string>();
    activeTasks.forEach((t) => {
      const type = t['Task type']?.trim();
      if (type) {
        types.add(type);
      }
    });
    return Array.from(types).sort();
  }, [activeTasks]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    activeTasks.forEach((t) => {
      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim();
      if (dept) {
        depts.add(dept);
      }
    });
    return Array.from(depts).sort();
  }, [activeTasks]);

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    activeTasks.forEach((t) => {
      const p = t.Period?.trim();
      if (p && p.length === 6 && /^\d+$/.test(p)) {
        periods.add(p);
      }
    });
    return Array.from(periods)
      .sort()
      .map((p) => ({
        raw: p,
        formatted: formatPeriod(p),
      }));
  }, [activeTasks]);

  const filteredTasksForTable = useMemo(() => {
    const list = filteredActiveTasksByCPR.filter((t) => {
      // 1. Timeline (Financial Year) filter at the top of the dashboard
      if (selectedTimeline !== 'All') {
        const fy = getFinancialYear(t.Period?.trim());
        if (fy !== selectedTimeline) {
          return false;
        }
      }

      // Hide all Cancel or On Hold tasks
      const status = (t.Status || '').trim().toLowerCase();
      if (
        status === 'cancel' ||
        status === 'cancelled' ||
        status === 'canceled' ||
        status === 'on hold' ||
        status === 'onhold' ||
        status === 'hold'
      ) {
        return false;
      }

      // 2. Task Name Filter (partial, case-insensitive)
      if (filterName.trim() !== '') {
        const nameMatch = (t['Task Name'] || '').toLowerCase().includes(filterName.toLowerCase());
        if (!nameMatch) return false;
      }

      // 3. Task Type Filter
      if (filterType !== 'All') {
        if (t['Task type']?.trim() !== filterType) {
          return false;
        }
      }

      // 4. Department Filter
      if (filterDept !== 'All') {
        const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
        if (dept !== filterDept) {
          return false;
        }
      }

      // 5. Date / Period Filter
      if (filterPeriod !== 'All') {
        if (t.Period?.trim() !== filterPeriod) {
          return false;
        }
      }

      return true;
    });

    // Default sort by Date (Created Date & Time or Created Date) descending: latest first
    return list.sort((a, b) => {
      const dateA = a['Created Date & Time'] || a['Created Date'] || '';
      const dateB = b['Created Date & Time'] || b['Created Date'] || '';
      return dateB.localeCompare(dateA);
    });
  }, [filteredActiveTasksByCPR, selectedTimeline, filterName, filterType, filterDept, filterPeriod]);

  const currentViewDepartments = useMemo(() => {
    const deptMap = new Map<string, { shortName: string; fullName: string }>();
    filteredTasksForTable.forEach((t) => {
      const shortName = t['Dpt/ Office']?.trim() || '';
      const fullName = t['Department/ Office']?.trim() || '';
      const key = fullName || shortName || 'Unassigned';
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          shortName: shortName || fullName || 'Unassigned',
          fullName: fullName || shortName || 'Unassigned',
        });
      }
    });
    return Array.from(deptMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [filteredTasksForTable]);

  const filteredViewDepartments = useMemo(() => {
    const query = deptSearchQuery.trim().toLowerCase();
    if (!query) return currentViewDepartments;
    return currentViewDepartments.filter(
      (dept) =>
        dept.shortName.toLowerCase().includes(query) ||
        dept.fullName.toLowerCase().includes(query)
    );
  }, [currentViewDepartments, deptSearchQuery]);

  const taskTypeDeptBreakdowns = useMemo(() => {
    const breakdowns: Record<string, { name: string; value: number }[]> = {};
    const taskTypeTotals: Record<string, number> = {};

    // Initialize lists for each task type
    availableTaskTypes.forEach((type) => {
      breakdowns[type] = [];
      taskTypeTotals[type] = 0;
    });

    filteredActiveTasksByCPR.forEach((t) => {
      // Respect timeline filter
      const period = t.Period?.trim() || '';
      const fy = getFinancialYear(period);
      if (selectedTimeline !== 'All' && fy !== selectedTimeline) {
        return;
      }

      const type = t['Task type']?.trim();
      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';

      if (type && breakdowns[type] !== undefined) {
        taskTypeTotals[type]++;
        // Find existing department in the breakdown
        const existing = breakdowns[type].find((item) => item.name === dept);
        if (existing) {
          existing.value++;
        } else {
          breakdowns[type].push({ name: dept, value: 1 });
        }
      }
    });

    // Sort departments by value descending for each task type
    availableTaskTypes.forEach((type) => {
      breakdowns[type].sort((a, b) => b.value - a.value);
    });

    return {
      breakdowns,
      totals: taskTypeTotals,
    };
  }, [filteredActiveTasksByCPR, selectedTimeline, availableTaskTypes]);

  const sortedTaskTypesByVolume = useMemo(() => {
    return [...availableTaskTypes].sort((a, b) => {
      const totalA = taskTypeDeptBreakdowns.totals[a] || 0;
      const totalB = taskTypeDeptBreakdowns.totals[b] || 0;
      return totalB - totalA;
    });
  }, [availableTaskTypes, taskTypeDeptBreakdowns.totals]);

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;

    const departmentCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const periodGrouping: Record<string, any> = {};
    const activeYearsSet = new Set<string>();

    // Time-Series comparison over 12 months of the Financial Year starting from July
    const monthsOrder = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthMap: Record<number, number> = {
      7: 0, 8: 1, 9: 2, 10: 3, 11: 4, 12: 5,
      1: 6, 2: 7, 3: 8, 4: 9, 5: 10, 6: 11
    };

    const comparisonSeries = monthsOrder.map((month) => {
      const obj: Record<string, any> = { name: month };
      obj[compareYearA] = 0;
      obj[compareYearB] = 0;
      return obj;
    });

    filteredActiveTasksByCPR.forEach((t) => {
      const period = t.Period?.trim() || '';
      const fy = getFinancialYear(period);
      if (fy) {
        activeYearsSet.add(fy);
      }

      // Track comparison time series dynamically based on user selects
      if (period.length === 6 && /^\d+$/.test(period)) {
        const monthNum = parseInt(period.substring(4, 6), 10);
        const index = monthMap[monthNum];
        if (index !== undefined) {
          if (fy === compareYearA) {
            comparisonSeries[index][compareYearA]++;
          } else if (fy === compareYearB) {
            comparisonSeries[index][compareYearB]++;
          }
        }
      }

      // Filter other stats by header selected timeline
      if (selectedTimeline !== 'All' && fy !== selectedTimeline) {
        return;
      }

      const status = t.Status?.trim().toLowerCase();
      if (status === 'done' || status === 'completed') {
        completed++;
      } else {
        inProgress++;
      }

      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      const rawStatus = t.Status?.trim() || 'Unknown';
      statusCounts[rawStatus] = (statusCounts[rawStatus] || 0) + 1;

      // Group task types and splits privately for hover metrics
      if (period && period.length === 6 && /^\d+$/.test(period)) {
        if (!periodGrouping[period]) {
          const initObj: any = {
            period,
            periodStr: formatPeriod(period),
            _splits: {}, // Nested object for tracking detailed splits privately
          };
          availableTaskTypes.forEach((type) => {
            initObj[type] = 0;
            initObj._splits[type] = { dc: 0, exceptDC: 0 };
          });
          periodGrouping[period] = initObj;
        }

        const taskType = t['Task type']?.trim();
        if (taskType && periodGrouping[period][taskType] !== undefined) {
          // Increment the total for this standard task type
          periodGrouping[period][taskType]++;

          // Classify the detailed splits privately
          const isDC = dept.toLowerCase() === 'cpr digital & creative' || (t['Dpt/ Office'] || '').trim().toLowerCase() === 'cpr digital & creative';
          if (isDC) {
            periodGrouping[period]._splits[taskType].dc++;
          } else {
            periodGrouping[period]._splits[taskType].exceptDC++;
          }
        }
      }
    });

    const departmentData = Object.entries(departmentCounts)
      .filter(([name]) => {
        if (excludeCPR && name.toLowerCase() === 'cpr digital & creative') {
          return false;
        }
        return true;
      })
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const statusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const taskTypeCounts: Record<string, number> = {};
    filteredActiveTasksByCPR.forEach((t) => {
      const period = t.Period?.trim() || '';
      const fy = getFinancialYear(period);
      if (selectedTimeline !== 'All' && fy !== selectedTimeline) {
        return;
      }
      const type = t['Task type']?.trim() || 'Unknown';
      taskTypeCounts[type] = (taskTypeCounts[type] || 0) + 1;
    });

    const taskTypeData = Object.entries(taskTypeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group department/units by CPR/CPRO, CPR Digital & Creative, and Others
    const deptGroupCounts: Record<string, number> = {
      'CPR Digital & Creative': 0,
      'CPRO OTHER TEAMS': 0,
      'OTHERS': 0,
    };

    filteredActiveTasksByCPR.forEach((t) => {
      const period = t.Period?.trim() || '';
      const fy = getFinancialYear(period);
      if (selectedTimeline !== 'All' && fy !== selectedTimeline) {
        return;
      }
      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
      const deptLower = dept.toLowerCase();
      const deptUpper = dept.toUpperCase();

      if (deptLower === 'cpr digital & creative') {
        deptGroupCounts['CPR Digital & Creative']++;
      } else if (deptUpper.includes('CPR') || deptUpper.includes('CPRO')) {
        deptGroupCounts['CPRO OTHER TEAMS']++;
      } else {
        deptGroupCounts['OTHERS']++;
      }
    });

    const deptGroupData = Object.entries(deptGroupCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);

    const monthlyTaskData = Object.keys(periodGrouping)
      .sort()
      .map((p) => periodGrouping[p]);

    const uniqueDeptsCount = Object.keys(departmentCounts).filter(
      (d) => d !== 'Unassigned'
    ).length;

    const totalProjects = selectedTimeline === 'All' ? filteredActiveTasksByCPR.length : completed + inProgress;
    const totalMonths = monthlyTaskData.length;
    
    const avgProjectsPerMonth = totalMonths > 0
      ? (totalProjects / totalMonths).toFixed(1)
      : '0.0';

    // The user's requested formula: COUNT_DISTINCT(CONCAT(YEAR, MONTH)) / 12
    const totalYears = totalMonths > 0 ? (totalMonths / 12) : 0;
    const avgProjectsPerYear = totalYears > 0
      ? (totalProjects / totalYears).toFixed(1)
      : '0.0';

    return {
      total: totalProjects,
      completed,
      inProgress,
      uniqueDeptsCount,
      departmentData,
      statusData,
      taskTypeData,
      deptGroupData,
      monthlyTaskData,
      comparisonSeries,
      avgProjectsPerMonth,
      avgProjectsPerYear,
      totalYears: parseFloat(totalYears.toFixed(2)),
      totalMonths,
    };
  }, [filteredActiveTasksByCPR, selectedTimeline, availableTaskTypes, compareYearA, compareYearB, excludeCPR]);

  if (loading) {
    return <div className="loader">Loading Dashboard...</div>;
  }

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="app-container">
        <header className="header glass-panel">
          <div className="header-title-area">
            <Activity size={32} color="#764393" />
            <h1>Creative & Digital Deliverables</h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.95rem', color: '#555555', fontWeight: 600 }}>Timeline:</span>
              <select
                className="glass-select"
                value={selectedTimeline}
                onChange={(e) => setSelectedTimeline(e.target.value)}
              >
                {availableFinancialYears.map((fy) => {
                  if (fy === 'All') return <option key="All" value="All">All Years</option>;
                  const startYear = fy.substring(3, 7);
                  const endYearStr = fy.substring(8);
                  const endYear = startYear.substring(0, 2) + endYearStr;
                  return (
                    <option key={fy} value={fy}>
                      {fy} (Jul 1, {startYear} - Jun 30, {endYear})
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Exclude Checkbox */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#764393',
              background: 'rgba(118, 67, 147, 0.05)',
              padding: '0.4rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid rgba(118, 67, 147, 0.15)',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}>
              <input
                type="checkbox"
                checked={excludeCPR}
                onChange={(e) => setExcludeCPR(e.target.checked)}
                style={{
                  accentColor: '#764393',
                  cursor: 'pointer',
                  width: '14px',
                  height: '14px',
                }}
              />
              EXCLUDE CPR DIGITAL & CREATIVE
            </label>
          </div>
        </header>

        {/* Metadata stats above KPI boxes */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          marginBottom: '-1.5rem', 
          paddingLeft: '0.5rem',
          fontSize: '0.85rem', 
          color: '#555555', 
          fontWeight: 700, 
          fontFamily: 'Montserrat, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span>Total Year: <span style={{ color: '#764393', fontWeight: 800, fontSize: '0.95rem' }}>{stats.totalYears}</span></span>
          <span>Total Month: <span style={{ color: '#764393', fontWeight: 800, fontSize: '0.95rem' }}>{stats.totalMonths}</span></span>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-grid">
          <div className="kpi-card glass-panel">
            <div className="kpi-icon kpi-icon-purple">
              <ListTodo size={28} />
            </div>
            <div className="kpi-info">
              <h3>Total Projects</h3>
              <div className="kpi-value">{stats.total}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon kpi-icon-gold">
              <Calendar size={28} />
            </div>
            <div className="kpi-info">
              <h3>Avg. Projects Per Year</h3>
              <div className="kpi-value">{stats.avgProjectsPerYear}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon kpi-icon-blue">
              <TrendingUp size={28} />
            </div>
            <div className="kpi-info">
              <h3>Avg. Projects Per Month</h3>
              <div className="kpi-value">{stats.avgProjectsPerMonth}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon kpi-icon-green">
              <Building size={28} />
            </div>
            <div className="kpi-info">
              <h3>Depts / Offices / Units</h3>
              <div className="kpi-value">{stats.uniqueDeptsCount}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon kpi-icon-gold">
              <Layers size={28} />
            </div>
            <div className="kpi-info">
              <h3>Task Types</h3>
              <div className="kpi-value">{stats.taskTypeData.length}</div>
            </div>
          </div>
        </div>

        {/* 1. Projects by Task Type & Month (Full-Width Vertical Stacked Bar Chart) */}
        <div className="chart-card glass-panel" style={{ width: '100%', padding: '2.5rem' }}>
          <div className="chart-header" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={24} color="#764393" />
              <h3 style={{ fontSize: '1.65rem' }}>Projects by Task Type & Month</h3>
            </div>
            <span style={{ fontSize: '0.9rem', color: '#555555', fontWeight: 600, backgroundColor: 'rgba(118, 67, 147, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
              {selectedTimeline === 'All' ? 'Showing All Months' : `Filtered to ${selectedTimeline}`}
            </span>
          </div>
          {/* Scrollable container for a long list of months (horizontal scrolling if there are many months) */}
          <div style={{ 
            width: '100%',
            overflowX: 'auto',
            paddingBottom: '15px',
            marginTop: '1.5rem'
          }}>
            <div style={{ minWidth: Math.max(800, stats.monthlyTaskData.length * 85), height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.monthlyTaskData}
                  margin={{ top: 20, right: 20, left: -5, bottom: 10 }}
                  barCategoryGap="10%"
                  maxBarSize={80}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(118, 67, 147, 0.1)" />
                  <XAxis
                    dataKey="periodStr"
                    stroke="#764393"
                    tickLine={false}
                    axisLine={{ stroke: '#764393', strokeWidth: 1.5 }}
                    tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}
                    dy={10}
                  />
                  <YAxis
                    type="number"
                    stroke="#764393"
                    tickLine={false}
                    axisLine={{ stroke: '#764393', strokeWidth: 1.5 }}
                    tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}
                    dx={-5}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20, fontSize: 12.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: '#333333' }}
                  />
                  {availableTaskTypes.map((type, index) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      stackId="a"
                      fill={getTaskTypeColor(type, index)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Double Pie Charts: Task Type & Department Groups side-by-side */}
        <div style={{ display: 'flex', gap: '2rem', width: '100%', flexWrap: 'wrap' }}>
          {/* Projects by Task Type (Pie Chart) */}
          <div className="chart-card glass-panel" style={{ flex: '1 1 calc(50% - 1rem)', minWidth: '400px', padding: '2.5rem' }}>
            <div className="chart-header" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={24} color="#764393" />
                <h3 style={{ fontSize: '1.65rem' }}>Projects by Task Type</h3>
              </div>
              <span style={{ fontSize: '0.9rem', color: '#555555', fontWeight: 600, backgroundColor: 'rgba(118, 67, 147, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                Distribution by Volume
              </span>
            </div>
            
            <div style={{ height: 450, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <Pie
                    data={stats.taskTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: '#764393', strokeWidth: 1 }}
                    label={renderCustomPieLabel}
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.taskTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getTaskTypeColor(entry.name, index)} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const total = stats.total;
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return [`${value} projects (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(118, 67, 147, 0.25)',
                      borderRadius: '12px',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 500,
                      boxShadow: '0 8px 32px 0 rgba(118, 67, 147, 0.08)',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 20, fontSize: 11.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: '#333333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projects by Department Group (Pie Chart) */}
          <div className="chart-card glass-panel" style={{ flex: '1 1 calc(50% - 1rem)', minWidth: '400px', padding: '2.5rem' }}>
            <div className="chart-header" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building size={24} color="#764393" />
                <h3 style={{ fontSize: '1.65rem' }}>Projects by Dept / Unit Group</h3>
              </div>
              <span style={{ fontSize: '0.9rem', color: '#555555', fontWeight: 600, backgroundColor: 'rgba(118, 67, 147, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                CPR vs. CPRO Others vs. Others
              </span>
            </div>
            
            <div style={{ height: 450, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <Pie
                    data={stats.deptGroupData}
                    cx="50%"
                    cy="50%"
                    labelLine={{ stroke: '#764393', strokeWidth: 1 }}
                    label={renderCustomPieLabel}
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.deptGroupData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={DEPT_GROUP_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const total = stats.total;
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return [`${value} projects (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(118, 67, 147, 0.25)',
                      borderRadius: '12px',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 500,
                      boxShadow: '0 8px 32px 0 rgba(118, 67, 147, 0.08)',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 20, fontSize: 11.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: '#333333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 2. Year-over-Year Comparison Timeline (Full-Width Area/Line Chart with Dynamic Selects) */}
        <div className="chart-card glass-panel" style={{ width: '100%' }}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="#764393" />
              <h3>YoY Monthly Workload Comparison</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                className="glass-select"
                value={compareYearA}
                onChange={(e) => setCompareYearA(e.target.value)}
              >
                {comparisonYearsList.map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.85rem', color: '#555555', fontWeight: 600 }}>vs</span>
              <select
                className="glass-select"
                value={compareYearB}
                onChange={(e) => setCompareYearB(e.target.value)}
              >
                {comparisonYearsList.map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.comparisonSeries}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(118, 67, 147, 0.1)" />
                <defs>
                  <linearGradient id="color2425" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#764393" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#764393" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="color2526" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82754B" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#82754B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#764393"
                  tick={{ fill: '#333333', fontSize: 10.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}
                />
                <YAxis
                  stroke="#764393"
                  tick={{ fill: '#333333', fontSize: 10.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(118, 67, 147, 0.25)',
                    borderRadius: '12px',
                    color: '#222222',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px 0 rgba(118, 67, 147, 0.08)',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontSize: 12, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: '#333333' }}
                />
                <Area
                  type="monotone"
                  dataKey={compareYearA}
                  stroke="#764393"
                  strokeWidth={5}
                  fillOpacity={1}
                  fill="url(#color2425)"
                />
                <Area
                  type="monotone"
                  dataKey={compareYearB}
                  stroke="#82754B"
                  strokeWidth={5}
                  fillOpacity={1}
                  fill="url(#color2526)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top 10 Departments, Offices & Units (Full-Width Card) */}
        <div className="chart-card glass-panel" style={{ width: '100%', padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.65rem', margin: 0 }}>Top 10 Departments, Offices & Units</h3>
            
            {/* Exclude Checkbox */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#764393',
              background: 'rgba(118, 67, 147, 0.05)',
              padding: '0.5rem 1.1rem',
              borderRadius: '20px',
              border: '1px solid rgba(118, 67, 147, 0.15)',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}>
              <input
                type="checkbox"
                checked={excludeCPR}
                onChange={(e) => setExcludeCPR(e.target.checked)}
                style={{
                  accentColor: '#764393',
                  cursor: 'pointer',
                  width: '15px',
                  height: '15px',
                }}
              />
              EXCLUDE CPR DIGITAL & CREATIVE
            </label>
          </div>
          <div style={{ height: 420, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.departmentData}
                margin={{ top: 10, right: 10, left: -20, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(118, 67, 147, 0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#764393"
                  tick={<CustomizedAxisTick />}
                  interval={0}
                />
                <YAxis
                  stroke="#764393"
                  tick={{ fill: '#333333', fontSize: 10.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(118, 67, 147, 0.25)',
                    borderRadius: '12px',
                    color: '#222222',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px 0 rgba(118, 67, 147, 0.08)',
                  }}
                />
                <Bar dataKey="value" fill="#764393" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Task Type Department Distributions (13+ Pie Charts Grid) */}
        <div className="chart-card glass-panel" style={{ width: '100%', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>Task Type Department Distributions</h3>
          <p style={{ color: '#555555', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            Individual breakdown of projects by departments, offices & units for each of the task types
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.75rem',
          }}>
            {sortedTaskTypesByVolume.map((type) => {
              const rawData = taskTypeDeptBreakdowns.breakdowns[type] || [];
              const total = taskTypeDeptBreakdowns.totals[type] || 0;

              const avgYear = stats.totalYears > 0 ? (total / stats.totalYears).toFixed(1) : '0.0';
              const avgMonth = stats.totalMonths > 0 ? (total / stats.totalMonths).toFixed(1) : '0.0';
              const deptsCount = rawData.length;
              const top10 = rawData.slice(0, 10);

              let data = rawData;
              if (rawData.length > 50) {
                const top50 = rawData.slice(0, 50);
                const othersValue = rawData.slice(50).reduce((sum, item) => sum + item.value, 0);
                data = [...top50, { name: 'Others', value: othersValue }];
              }

              return (
                <div key={type} className="glass-panel" style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.55)',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(118, 67, 147, 0.12)',
                  boxShadow: '0 4px 15px 0 rgba(118, 67, 147, 0.03)',
                  borderRadius: '12px',
                }}>
                  {/* Header */}
                  <h4 style={{ fontSize: '1.05rem', color: '#764393', fontWeight: 800, margin: '0 0 1rem 0', textAlign: 'center', minHeight: '24px' }}>
                    {type}
                  </h4>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.25rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    background: 'rgba(118, 67, 147, 0.04)',
                    padding: '0.5rem',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: 700, letterSpacing: '0.02em' }}>TOTAL</div>
                      <div style={{ fontSize: '0.85rem', color: '#222', fontWeight: 800 }}>{total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: 700, letterSpacing: '0.02em' }}>AVG/YR</div>
                      <div style={{ fontSize: '0.85rem', color: '#222', fontWeight: 800 }}>{avgYear}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: 700, letterSpacing: '0.02em' }}>AVG/MO</div>
                      <div style={{ fontSize: '0.85rem', color: '#222', fontWeight: 800 }}>{avgMonth}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: '#555', fontWeight: 700, letterSpacing: '0.02em' }}>DEPTS NO.</div>
                      <div style={{ fontSize: '0.85rem', color: '#222', fontWeight: 800 }}>{deptsCount}</div>
                    </div>
                  </div>

                  {/* Body: Pie Chart + Top 10 */}
                  <div style={{ display: 'flex', width: '100%', height: 260, gap: '0.75rem', alignItems: 'center' }}>
                    {total > 0 ? (
                      <>
                        {/* Pie Chart */}
                        <div style={{ flex: '1.1', height: '100%', minWidth: 0, position: 'relative' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                {data.map((entry, dIdx) => (
                                  <Cell 
                                    key={`cell-${dIdx}`} 
                                    fill={entry.name === 'Others' ? '#CCCCCC' : COLORS[dIdx % COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                  border: '1px solid rgba(118, 67, 147, 0.2)',
                                  borderRadius: '8px',
                                  color: '#222222',
                                  fontFamily: 'Montserrat, sans-serif',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  boxShadow: '0 4px 12px 0 rgba(118, 67, 147, 0.08)',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Effort Level Overlay */}
                          {EFFORT_LEVELS[type] && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              textAlign: 'center',
                            }}>
                              <span style={{ fontSize: '0.45rem', fontWeight: 800, color: '#555555', letterSpacing: '0.05em', lineHeight: 1 }}>EFFORT</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#764393', lineHeight: 1.1 }}>{EFFORT_LEVELS[type]}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Top 10 List */}
                        <div style={{
                          flex: '0.9',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          overflowY: 'auto',
                          paddingRight: '0.4rem'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#764393', borderBottom: '1px solid rgba(118, 67, 147, 0.15)', paddingBottom: '0.25rem', marginBottom: '0.1rem', flexShrink: 0 }}>
                            TOP 10 DEPTS
                          </div>
                          {top10.map((dept, i) => {
                            let shortName = dept.name
                              .replace(/Department of /gi, '')
                              .replace(/Office of /gi, '');
                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.7rem', gap: '0.5rem' }}>
                                <span title={dept.name} style={{
                                  fontWeight: 600,
                                  color: '#444',
                                  lineHeight: 1.25,
                                  wordBreak: 'break-word',
                                }}>
                                  {i + 1}. {shortName}
                                </span>
                                <span style={{ fontWeight: 700, color: '#764393', backgroundColor: 'rgba(118, 67, 147, 0.08)', padding: '0.1rem 0.35rem', borderRadius: '6px', fontSize: '0.65rem', flexShrink: 0 }}>
                                  {dept.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem', color: '#888888', fontWeight: 500 }}>
                        No data
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-panel table-container" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#764393' }}>Deliverables List</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555555', fontWeight: 500 }}>
              Showing {Math.min(15, filteredTasksForTable.length)} of {filteredTasksForTable.length} filtered deliverables
            </p>
          </div>

          {/* Interactive Filters Panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
            padding: '1.25rem',
            background: 'rgba(118, 67, 147, 0.04)',
            border: '1px solid rgba(118, 67, 147, 0.1)',
            borderRadius: '12px',
          }}>
            {/* Task Name Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                TASK NAME
              </label>
              <input
                type="text"
                placeholder="Search task name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(118, 67, 147, 0.25)',
                  color: '#222222',
                  fontWeight: 600,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              />
            </div>

            {/* Task Type Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                TASK TYPE
              </label>
              <select
                className="glass-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="All">All Types</option>
                {availableTaskTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                DEPARTMENT
              </label>
              <select
                className="glass-select"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="All">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Date / Month Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                DATE / MONTH
              </label>
              <select
                className="glass-select"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="All">All Months</option>
                {availablePeriods.map((p) => (
                  <option key={p.raw} value={p.raw}>{p.formatted}</option>
                ))}
              </select>
            </div>
          </div>

          <table style={{ marginTop: '1rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Date</th>
                <th>Task Name</th>
                <th>Department / Office / Unit</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasksForTable.length > 0 ? (
                filteredTasksForTable
                  .slice(0, 15)
                  .map((task, i) => {
                    const displayDept = task['Department/ Office']?.trim() || task['Dpt/ Office']?.trim() || 'Unassigned';
                    const displayDate = formatPeriod(task.Period?.trim()) || 'N/A';

                    return (
                      <tr key={i}>
                        <td style={{ color: '#764393', fontWeight: 600 }}>
                          {displayDate}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {task['Task Name'] || 'Untitled'}
                        </td>
                        <td>{displayDept}</td>
                        <td>{task['Task type']}</td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#555555', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                    No deliverables match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Active Departments / Units in Current View */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Building size={24} color="#764393" />
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#764393' }}>Departments / Units in Current View</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#555555', fontWeight: 500, marginBottom: '1.5rem' }}>
            A total of <span style={{ fontWeight: 700, color: '#764393' }}>{currentViewDepartments.length}</span> departments/units are active in the filtered view below.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            {currentViewDepartments.map((dept, idx) => (
              <span
                key={idx}
                title={dept.fullName}
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#764393',
                  background: 'rgba(118, 67, 147, 0.05)',
                  border: '1px solid rgba(118, 67, 147, 0.12)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px 0 rgba(118, 67, 147, 0.02)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                {dept.fullName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
