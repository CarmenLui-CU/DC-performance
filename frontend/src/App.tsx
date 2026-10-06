import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import {
  ListTodo,
  Activity,
  Calendar,
  Building,
  TrendingUp,
  Layers,
  Palette,
  Gift,
  Share2,
  BookOpen,
  Globe,
  Tag,
  Megaphone,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';
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

interface GraphicDesignCategoryInfo {
  category: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  examples: string[];
}

const GRAPHIC_DESIGN_CATEGORIES: Record<string, GraphicDesignCategoryInfo> = {
  'Social Post': {
    category: 'Social Post',
    shortLabel: 'Social Post',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
    description: 'Instagram, Facebook, WeChat, RedNote, LinkedIn & Weibo posts, feeds, reels, and stories.',
    examples: ['Mooncake Social media posts', 'CUHK in Pixels social reels', 'WeChat articles cover', 'RedNote campus features', 'IG feed & story announcements'],
  },
  'Souvenir & Merchandise': {
    category: 'Souvenir & Merchandise',
    shortLabel: 'Souvenir',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
    description: 'Custom university souvenirs, Mooncake gift boxes, Red packets (Lai See), Annual calendars, 60A gifts, and merchandise.',
    examples: ['Design mooncake box', 'CUHK 60A souvenirs online sales', 'Compliment slip for CUHK Calendar', 'Red packets & Festive stationery', 'Congregation souvenir booth items'],
  },
  'Event & Exhibition': {
    category: 'Event & Exhibition',
    shortLabel: 'Event Collateral',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.25)',
    description: 'Stage backdrops, Campus LED screen graphics, Info Day panels, Congregation stage visuals, and ceremonial banners.',
    examples: ['Inaugural Lecture backdrops', 'Campus LED screen visuals', 'Info Day exhibition panels', 'Congregation stage banners', 'Flag-raising ceremony displays'],
  },
  'Publication & Editorial': {
    category: 'Publication & Editorial',
    shortLabel: 'Publication',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    description: 'CUHK Bulletin, Facts & Figures booklets, Annual reports, Mainland visit brochures, and informational leaflets.',
    examples: ['Bulletin 2023 Issue #2', 'Facts and Figures booklet', 'Mainland Media Visit Brochure', 'Annual Financial Report', 'Information leaflets & pamphlets'],
  },
  'Digital & Web Graphics': {
    category: 'Digital & Web Graphics',
    shortLabel: 'Digital / Web',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.25)',
    description: 'CUHK Main Site hero banners, CUHK in Focus visual headers, eDM graphics, digital wallpapers, and portal UI graphics.',
    examples: ['CUHK Main Site Hero Banner', 'CUHK in Focus graphics', 'eDM header banners', 'Desktop & mobile wallpapers', 'Portal UI & thumbnail graphics'],
  },
  'Media & Research Publicity': {
    category: 'Media & Research Publicity',
    shortLabel: 'Media & PR',
    color: '#82754B',
    bg: 'rgba(130, 117, 75, 0.08)',
    border: 'rgba(130, 117, 75, 0.25)',
    description: 'Press release graphics, academic & research breakthroughs, World university rankings (QS/THE), and award announcements.',
    examples: ['QS / Times Higher Ed rankings graphic', 'RGC / Ministry of Education award graphics', 'Press release on scientific discoveries', 'JUPAS & admission data infographics', 'Scholarship & fellowship announcements'],
  },
  'Branding & Print Collateral': {
    category: 'Branding & Print Collateral',
    shortLabel: 'Branding / Print',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.25)',
    description: 'University greeting & festive cards, posters, event certificates, brand guidelines, and print advertisements.',
    examples: ["VC's Season's Greetings Cards", 'University Event Posters', 'Honorary Fellow & Award Certificates', 'Sing Tao & HK01 newspaper print ads', 'Brand identity guidelines'],
  },
  'General Creative Design': {
    category: 'General Creative Design',
    shortLabel: 'General Creative',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.08)',
    border: 'rgba(100, 116, 139, 0.25)',
    description: 'Specialized design mockups, asset conversion, photo preparation, and administrative graphic requests.',
    examples: ['Photo retouch & asset prep', 'Specialized campaign templates', 'University campus maps', 'Creative concept mockups', 'Administrative chart graphics'],
  },
};

const getGraphicDesignSource = (t: TaskRecord): GraphicDesignCategoryInfo => {
  const name = (t['Task Name'] || t['PROJECT NAME'] || '').toLowerCase();
  const tags = (t.Tags || '').toLowerCase();
  const plat = (t['For this Platform'] || '').toLowerCase();
  const dop = (t['digital or print'] || '').toLowerCase();

  // 1. Souvenir & Merchandise (High Priority check)
  if (
    tags.includes('souvenir') || name.includes('souvenir') || 
    tags.includes('mooncake') || name.includes('mooncake') ||
    tags.includes('redpacket') || name.includes('redpacket') || name.includes('red packet') ||
    name.includes('compliment slip') || tags.includes('stationery') ||
    name.includes('calendar') || tags.includes('calendar') ||
    name.includes('greeting') || tags.includes('greeting') ||
    name.includes("season's greetings") || name.includes('seasons greetings') ||
    name.includes('christmas card') || tags.includes('christmas card') ||
    name.includes('cny card') || tags.includes('cny card') ||
    tags.includes('printed card') || tags.includes('ecard') ||
    name.includes('farewell card') || name.includes('jumbo card') ||
    name.includes('t-shirt') || name.includes('tee') || name.includes('tote') ||
    name.includes('badge') || name.includes('umbrella') || name.includes('gift') ||
    tags.includes('stickers') || name.includes('sticker') ||
    name.includes('pin ') || name.includes('mug') || name.includes('scarf') || name.includes('tie ') ||
    name.includes('medal') || name.includes('trophy') || name.includes('packaging') || tags.includes('packaging') ||
    name.includes('merchandise') || tags.includes('merchandise')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Souvenir & Merchandise'];
  }

  // 2. Social Post (Prevent poster collision)
  const isPosterOnly = (plat.includes('poster') || name.includes('poster') || tags.includes('poster')) &&
    !plat.includes('facebook') && !plat.includes('instagram') && !plat.includes('wechat') && !plat.includes('rednote') && !plat.includes('weibo') && !plat.includes('linkedin') && !tags.includes('social');

  if (
    !isPosterOnly &&
    (
      tags.includes('social') || tags.includes('wechat') || tags.includes('rednote') ||
      (plat.includes('post') && !plat.includes('poster')) || plat.includes('instagram') || plat.includes('facebook') ||
      plat.includes('wechat') || plat.includes('rednote') || plat.includes('weibo') ||
      plat.includes('twitter') || plat.includes('linkedin') || plat.includes('reel') ||
      plat.includes('stories') || name.includes('social') || name.includes('ig ') ||
      name.includes('fb ') || name.includes('feed post') || name.includes('ig reel') ||
      name.includes('story') || (name.includes('post') && !name.includes('poster') && !name.includes('postgraduate')) ||
      name.includes('cover_') || name.includes('wechat cover')
    )
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Social Post'];
  }

  // 3. Event & Exhibition Collateral
  if (
    tags.includes('backdrop') || tags.includes('ebanner') || plat.includes('backdrop') ||
    plat.includes('led') || tags.includes('signage') || tags.includes('congregation') ||
    tags.includes('ceremony') || tags.includes('lecture') || tags.includes('flag-raising') ||
    tags.includes('exhibition') || name.includes('backdrop') || name.includes('led') ||
    name.includes('banner') || name.includes('signage') || name.includes('booth') ||
    name.includes('stage') || name.includes('panel') || name.includes('screen') ||
    name.includes('roll up') || name.includes('rollup') || tags.includes('event') ||
    name.includes('congratulat') || name.includes('ceremony') || name.includes('inauguration') ||
    name.includes('flag raising') || tags.includes('sports') || name.includes('congregation') ||
    name.includes('orientation day') || name.includes('luncheon') || name.includes('workshop') ||
    name.includes('celebrat') || tags.includes('info day')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Event & Exhibition'];
  }

  // 4. Publication & Editorial
  if (
    tags.includes('publication') || tags.includes('bulletin') || tags.includes('annual report') ||
    tags.includes('pamphlet') || tags.includes('leaflet') || tags.includes('book') ||
    tags.includes('enewsletter') || tags.includes('facts and figures') || name.includes('brochure') ||
    name.includes('bulletin') || name.includes('report') || name.includes('leaflet') ||
    name.includes('pamphlet') || name.includes('book') || name.includes('newsletter') ||
    name.includes('handbook') || name.includes('manual') || name.includes('guideline') ||
    tags.includes('guideline') || name.includes('map') || tags.includes('map')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Publication & Editorial'];
  }

  // 5. Digital & Web Graphics
  if (
    plat.includes('site') || plat.includes('hero banner') || plat.includes('pixels') ||
    tags.includes('website') || tags.includes('hero banner') || tags.includes('edm') ||
    tags.includes('wallpaper') || tags.includes('user interface') || name.includes('hero banner') ||
    name.includes('web') || name.includes('edm') || name.includes('portal') ||
    name.includes('thumbnail') || name.includes('icon') || tags.includes('icons') ||
    name.includes('wallpaper') || name.includes('touch') || tags.includes('cuhk in touch') ||
    name.includes('canto') || name.includes('infographic') || tags.includes('infographic') ||
    name.includes('podcast') || name.includes('designed backgrounds')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Digital & Web Graphics'];
  }

  // 6. Media & Research Publicity
  if (
    tags.includes('press release') || tags.includes('press conference') || tags.includes('media') ||
    name.includes('press release') || name.includes('press conference') || tags.includes('news') ||
    tags.includes('research') || name.includes('interview') || tags.includes('rankings') ||
    tags.includes('qs') || tags.includes('times higher ed') || tags.includes('us news') ||
    name.includes('scholarship') || name.includes('jupas') || name.includes('fellow') ||
    name.includes('award') || name.includes('rgc') || name.includes('ranking') ||
    name.includes('satellite') || name.includes('dr.') || name.includes('prof.') ||
    name.includes('professor') || tags.includes('academic') || tags.includes('admission') ||
    name.includes('science') || name.includes('chemistry') || name.includes('astronomy') ||
    name.includes('standout')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Media & Research Publicity'];
  }

  // 7. Branding & Print Collateral
  if (
    tags.includes('branding') || tags.includes('logo') || tags.includes('poster') ||
    tags.includes('certificates') || tags.includes('card') || tags.includes('name card') ||
    tags.includes('advertisement') || name.includes('poster') || name.includes('card') ||
    name.includes('certificate') || name.includes('logo') || name.includes('flyer') ||
    name.includes('ppt') || tags.includes('ppt') || name.includes('presentation') ||
    name.includes('badge') || name.includes('chart') || dop.includes('print') ||
    name.includes('obituary') || name.includes('memory') || name.includes('mourning') ||
    name.includes('ad') || name.includes('advertisement') || name.includes('proposal') ||
    name.includes('photo request')
  ) {
    return GRAPHIC_DESIGN_CATEGORIES['Branding & Print Collateral'];
  }

  return GRAPHIC_DESIGN_CATEGORIES['General Creative Design'];
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
  const [activeTab, setActiveTab] = useState<'requests' | 'services'>('requests');
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

  // Pagination states
  const [deptPage, setDeptPage] = useState<number>(1);

  // eDM Statistics states
  const [edmTasks, setEdmTasks] = useState<any[]>([]);
  const [edmLoading, setEdmLoading] = useState(true);

  // CUHK Visuals log summary state
  const [visualsSummary, setVisualsSummary] = useState<any>(null);
  const [visualsLoading, setVisualsLoading] = useState<boolean>(true);
  const [visualsError, setVisualsError] = useState<string | null>(null);
  const [visualsSubTab, setVisualsSubTab] = useState<'overview' | 'previews' | 'downloads' | 'shares' | 'journey' | 'attributes'>('overview');
  const [damSubTab, setDamSubTab] = useState<'overview' | 'previews' | 'downloads' | 'journey' | 'attributes'>('overview');

  // Graphic Design section states
  const [gdSelectedCategory, setGdSelectedCategory] = useState<string>('All');
  const [gdSearchQuery, setGdSearchQuery] = useState<string>('');
  const [gdMediumFilter, setGdMediumFilter] = useState<'All' | 'Digital' | 'Print' | 'Digital & Print'>('All');
  const [gdStatusFilter, setGdStatusFilter] = useState<'All' | 'Done' | 'In Progress'>('All');
  const [gdPage, setGdPage] = useState<number>(1);
  const [gdActiveSubTab, setGdActiveSubTab] = useState<'overview' | 'sources' | 'explorer' | 'departments'>('overview');
  const [expandedGdTaskId, setExpandedGdTaskId] = useState<string | null>(null);

  useEffect(() => {
    // If not localhost, or if local fetch fails, fetch directly from Google Sheet CSV
    const SHEET_ID = '10QwbD_iQuL2iL4HAkhZ61uAIiXcvSOT6j1EcswRO-lY';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

    const EDM_URL = 'https://docs.google.com/spreadsheets/d/1uhlxFpYAuOXO4A1BhKVWp56dKskzq6Oh8HTee8kfaiM/gviz/tq?tqx=out:csv&sheet=CUHK%20Focus%20eDM';

    const fetchTasksDirectly = () => {
      fetch(CSV_URL)
        .then((res) => res.text())
        .then((text) => {
          const parsed = parseCSV(text);
          if (parsed && parsed.length > 0) {
            const normalized = parsed.map((t: any) => ({
              ...t,
              'PROJECT NAME': t['PROJECT NAME'] || t['Task Name'] || 'Untitled',
            }));
            setTasks(normalized);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching directly from Google Sheet:', err);
          setLoading(false);
        });
    };

    const fetchEdmDirectly = () => {
      fetch(EDM_URL)
        .then((res) => res.text())
        .then((text) => {
          const parsed = parseCSV(text);
          if (parsed && parsed.length > 0) {
            setEdmTasks(parsed);
          }
          setEdmLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching EDM directly from Google Sheet:', err);
          setEdmLoading(false);
        });
    };

    const fetchVisualsDirectly = () => {
      setVisualsLoading(true);
      setVisualsError(null);
      fetch('./visuals-summary.json')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch from static JSON.');
          return res.json();
        })
        .then((data) => {
          if (data.data) {
            setVisualsSummary(data.data);
          } else {
            setVisualsError('Failed to fetch visuals log details.');
          }
          setVisualsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching visuals summary directly:', err);
          setVisualsError('Failed to load visuals details.');
          setVisualsLoading(false);
        });
    };

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetch('http://localhost:3001/api/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            const normalized = data.data.map((t: any) => ({
              ...t,
              'PROJECT NAME': t['PROJECT NAME'] || t['Task Name'] || 'Untitled',
            }));
            setTasks(normalized);
            setLoading(false);
          } else {
            fetchTasksDirectly();
          }
        })
        .catch((err) => {
          console.warn('Backend connection failed, falling back to direct Google Sheet fetch:', err);
          fetchTasksDirectly();
        });

      fetch('http://localhost:3001/api/edm-stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setEdmTasks(data.data);
            setEdmLoading(false);
          } else {
            fetchEdmDirectly();
          }
        })
        .catch((err) => {
          console.warn('Backend connection failed for EDM, falling back to direct Google Sheet fetch:', err);
          fetchEdmDirectly();
        });

      fetch('http://localhost:3001/api/visuals-summary')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setVisualsSummary(data.data);
            setVisualsLoading(false);
          } else {
            fetchVisualsDirectly();
          }
        })
        .catch((err) => {
          console.warn('Backend connection failed for visuals summary, falling back to direct fetch:', err);
          fetchVisualsDirectly();
        });
    } else {
      fetchTasksDirectly();
      fetchEdmDirectly();
      fetchVisualsDirectly();
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

      // 2. PROJECT NAME Filter (partial, case-insensitive)
      if (filterName.trim() !== '') {
        const nameMatch = (t['PROJECT NAME'] || '').toLowerCase().includes(filterName.toLowerCase());
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
    return Array.from(deptMap.values()).sort((a, b) => a.shortName.localeCompare(b.shortName));
  }, [filteredTasksForTable]);

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

  const cuhkVisualsAssetRequests = useMemo(() => {
    return activeTasks.filter((t) => {
      const isVisuals = (t['Task type'] || '').trim() === 'CUHK Visuals';
      const isAssetRequest = (t['PROJECT NAME'] || '').toLowerCase().includes('asset request');
      if (!isVisuals || !isAssetRequest) return false;

      // Filter by selected timeline / FY
      if (selectedTimeline !== 'All') {
        const p = t.Period?.trim();
        const fy = getFinancialYear(p);
        if (fy !== selectedTimeline) return false;
      }
      return true;
    });
  }, [activeTasks, selectedTimeline]);

  // Graphic Design analysis for Services Impacted
  const graphicDesignData = useMemo(() => {
    const gdTasks = filteredActiveTasksByCPR.filter((t) => {
      const period = t.Period?.trim() || '';
      const fy = getFinancialYear(period);
      if (selectedTimeline !== 'All' && fy !== selectedTimeline) {
        return false;
      }
      return (t['Task type'] || '').trim().toLowerCase() === 'graphic design';
    });

    let completedCount = 0;
    let inProgressCount = 0;
    const deptCounts: Record<string, number> = {};
    const sourceBuckets: Record<string, { info: GraphicDesignCategoryInfo; tasks: TaskRecord[]; depts: Record<string, number> }> = {};

    Object.keys(GRAPHIC_DESIGN_CATEGORIES).forEach((key) => {
      sourceBuckets[key] = {
        info: GRAPHIC_DESIGN_CATEGORIES[key],
        tasks: [],
        depts: {},
      };
    });

    const formatCounts = {
      Digital: 0,
      Print: 0,
      'Digital & Print': 0,
      Unspecified: 0,
    };

    const monthlySourceMap: Record<string, Record<string, number>> = {};

    gdTasks.forEach((t) => {
      const s = t.Status?.trim().toLowerCase();
      if (s === 'done' || s === 'completed') {
        completedCount++;
      } else {
        inProgressCount++;
      }

      const dept = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
      if (dept !== 'Unassigned') {
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }

      const dop = (t['digital or print'] || '').toLowerCase();
      if (dop.includes('digital') && dop.includes('print')) {
        formatCounts['Digital & Print']++;
      } else if (dop.includes('digital')) {
        formatCounts.Digital++;
      } else if (dop.includes('print')) {
        formatCounts.Print++;
      } else {
        formatCounts.Unspecified++;
      }

      const catInfo = getGraphicDesignSource(t);
      const bucket = sourceBuckets[catInfo.category] || sourceBuckets['General Creative Design'];
      bucket.tasks.push(t);
      if (dept !== 'Unassigned') {
        bucket.depts[dept] = (bucket.depts[dept] || 0) + 1;
      }

      const period = t.Period?.trim() || '';
      if (period.length === 6) {
        if (!monthlySourceMap[period]) {
          monthlySourceMap[period] = {};
        }
        monthlySourceMap[period][catInfo.shortLabel] = (monthlySourceMap[period][catInfo.shortLabel] || 0) + 1;
      }
    });

    const total = gdTasks.length;

    const sourceStats = Object.entries(sourceBuckets).map(([category, bucket]) => {
      const count = bucket.tasks.length;
      const percentage = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;
      const topDepts = Object.entries(bucket.depts)
        .map(([name, deptCount]) => ({ name, count: deptCount }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      let bucketCompleted = 0;
      bucket.tasks.forEach((item) => {
        const status = item.Status?.trim().toLowerCase();
        if (status === 'done' || status === 'completed') bucketCompleted++;
      });

      return {
        category,
        info: bucket.info,
        count,
        percentage,
        completed: bucketCompleted,
        inProgress: count - bucketCompleted,
        topDepts,
        tasks: bucket.tasks,
        uniqueDeptsCount: Object.keys(bucket.depts).length,
      };
    }).sort((a, b) => b.count - a.count);

    const topDepartments = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sortedPeriods = Object.keys(monthlySourceMap).sort();
    const monthlyTrend = sortedPeriods.map((period) => {
      const entry: any = {
        period,
        name: formatPeriod(period),
      };
      let periodTotal = 0;
      Object.keys(monthlySourceMap[period]).forEach((label) => {
        const val = monthlySourceMap[period][label];
        entry[label] = val;
        periodTotal += val;
      });
      entry.total = periodTotal;
      return entry;
    });

    const formatBreakdown = [
      { name: 'Digital Projects', value: formatCounts.Digital, color: '#3B82F6' },
      { name: 'Print Collateral', value: formatCounts.Print, color: '#F59E0B' },
      { name: 'Digital & Print Hybrid', value: formatCounts['Digital & Print'], color: '#10B981' },
      { name: 'General / Multi-Format', value: formatCounts.Unspecified, color: '#8B5CF6' },
    ].filter((f) => f.value > 0);

    return {
      total,
      completedCount,
      inProgressCount,
      uniqueDeptsCount: Object.keys(deptCounts).length,
      sourceStats,
      topDepartments,
      monthlyTrend,
      formatCounts,
      formatBreakdown,
      allTasks: gdTasks,
    };
  }, [filteredActiveTasksByCPR, selectedTimeline]);

  // Filtered graphic design tasks for the interactive explorer
  const filteredGraphicDesignTasks = useMemo(() => {
    return graphicDesignData.allTasks.filter((t) => {
      // Source filter
      if (gdSelectedCategory !== 'All') {
        const catInfo = getGraphicDesignSource(t);
        if (catInfo.category !== gdSelectedCategory) return false;
      }

      // Medium filter
      if (gdMediumFilter !== 'All') {
        const dop = (t['digital or print'] || '').toLowerCase();
        if (gdMediumFilter === 'Digital & Print') {
          if (!dop.includes('digital') || !dop.includes('print')) return false;
        } else if (gdMediumFilter === 'Digital') {
          if (!dop.includes('digital') || dop.includes('print')) return false;
        } else if (gdMediumFilter === 'Print') {
          if (!dop.includes('print') || dop.includes('digital')) return false;
        }
      }

      // Status filter
      if (gdStatusFilter !== 'All') {
        const s = (t.Status || '').trim().toLowerCase();
        const isDone = s === 'done' || s === 'completed';
        if (gdStatusFilter === 'Done' && !isDone) return false;
        if (gdStatusFilter === 'In Progress' && isDone) return false;
      }

      // Search query
      if (gdSearchQuery.trim()) {
        const q = gdSearchQuery.trim().toLowerCase();
        const name = (t['PROJECT NAME'] || t['Task Name'] || '').toLowerCase();
        const dept = (t['Department/ Office'] || t['Dpt/ Office'] || '').toLowerCase();
        const tags = (t.Tags || '').toLowerCase();
        const handler = (t.Handler || '').toLowerCase();
        const platform = (t['For this Platform'] || '').toLowerCase();
        const obj = (t['Objectives '] || '').toLowerCase();
        const supplied = (t['Supplied Text'] || '').toLowerCase();
        if (
          !name.includes(q) &&
          !dept.includes(q) &&
          !tags.includes(q) &&
          !handler.includes(q) &&
          !platform.includes(q) &&
          !obj.includes(q) &&
          !supplied.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [graphicDesignData.allTasks, gdSelectedCategory, gdMediumFilter, gdStatusFilter, gdSearchQuery]);

  const gdTotalPages = Math.max(1, Math.ceil(filteredGraphicDesignTasks.length / 12));
  const paginatedGdTasks = useMemo(() => {
    const start = (gdPage - 1) * 12;
    return filteredGraphicDesignTasks.slice(start, start + 12);
  }, [filteredGraphicDesignTasks, gdPage]);

  const edmSummary = useMemo(() => {
    let totalDelivered = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let sumCTR = 0;
    let sumOR = 0;
    let sumCTOR = 0;
    let count = 0;
    const uniqueDays = new Set<string>();

    const audienceMap: Record<string, { target: string; sumCTR: number; sumOR: number; count: number; totalDelivered: number }> = {};

    edmTasks.forEach((t) => {
      const ctrStr = t['Click-through ratio (CTR)'] || '';
      const orStr = t['Open ratio (OR)'] || '';
      const ctorStr = t['Click-to-Open ratio (CTOR)'] || '';
      const delivered = parseFloat((t['Delivered'] || '').replace(/,/g, '')) || 0;
      const opens = parseFloat((t['Total opens'] || '').replace(/,/g, '')) || 0;
      const clicks = parseFloat((t['Total clicks'] || '').replace(/,/g, '')) || 0;
      const target = t['Target list']?.trim() || 'Unknown';
      const scheduled = t.Scheduled?.trim() || '';

      if (scheduled && scheduled.length >= 10) {
        uniqueDays.add(scheduled.substring(0, 10));
      }

      if (ctrStr && orStr) {
        const ctr = parseFloat(ctrStr.replace('%', ''));
        const or = parseFloat(orStr.replace('%', ''));
        const ctor = parseFloat(ctorStr.replace('%', '')) || 0;
        
        if (!isNaN(ctr) && !isNaN(or)) {
          sumCTR += ctr;
          sumOR += or;
          sumCTOR += ctor;
          count++;

          if (!audienceMap[target]) {
            audienceMap[target] = { target, sumCTR: 0, sumOR: 0, count: 0, totalDelivered: 0 };
          }
          audienceMap[target].sumCTR += ctr;
          audienceMap[target].sumOR += or;
          audienceMap[target].count++;
          audienceMap[target].totalDelivered += delivered;
        }
      }

      totalDelivered += delivered;
      totalOpens += opens;
      totalClicks += clicks;
    });

    const audienceBreakdown = Object.values(audienceMap)
      .map((item) => ({
        target: item.target,
        or: parseFloat((item.sumOR / item.count).toFixed(2)),
        ctr: parseFloat((item.sumCTR / item.count).toFixed(2)),
        delivered: item.totalDelivered,
        count: item.count,
      }))
      .sort((a, b) => b.or - a.or);

    const issuesCount = uniqueDays.size;

    return {
      totalCampaigns: count,
      issuesCount,
      avgOR: count > 0 ? parseFloat((sumOR / count).toFixed(2)) : 0,
      avgCTR: count > 0 ? parseFloat((sumCTR / count).toFixed(2)) : 0,
      avgCTOR: count > 0 ? parseFloat((sumCTOR / count).toFixed(2)) : 0,
      totalDelivered,
      totalOpens,
      totalClicks,
      avgOpensPerIssue: issuesCount > 0 ? totalOpens / issuesCount : 0,
      avgDeliveredPerIssue: issuesCount > 0 ? totalDelivered / issuesCount : 0,
      avgClicksPerIssue: issuesCount > 0 ? totalClicks / issuesCount : 0,
      audienceBreakdown,
    };
  }, [edmTasks]);

  const edmPerformanceTrend = useMemo(() => {
    const monthlyMap: Record<string, { monthStr: string, sumCTR: number, sumOR: number, count: number }> = {};
    
    edmTasks.forEach((t) => {
      const scheduled = t.Scheduled?.trim() || '';
      if (!scheduled || scheduled.length < 7) return;
      const monthKey = scheduled.substring(0, 7); // "YYYY-MM"
      
      const ctrStr = t['Click-through ratio (CTR)'] || '';
      const orStr = t['Open ratio (OR)'] || '';
      
      if (ctrStr && orStr) {
        const ctr = parseFloat(ctrStr.replace('%', ''));
        const or = parseFloat(orStr.replace('%', ''));
        if (!isNaN(ctr) && !isNaN(or)) {
          if (!monthlyMap[monthKey]) {
            const year = monthKey.substring(0, 4);
            const monthNum = parseInt(monthKey.substring(5, 7), 10);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formatted = `${months[monthNum - 1]} ${year}`;
            monthlyMap[monthKey] = { monthStr: formatted, sumCTR: 0, sumOR: 0, count: 0 };
          }
          monthlyMap[monthKey].sumCTR += ctr;
          monthlyMap[monthKey].sumOR += or;
          monthlyMap[monthKey].count++;
        }
      }
    });

    return Object.keys(monthlyMap)
      .sort()
      .map((k) => {
        const item = monthlyMap[k];
        return {
          name: item.monthStr,
          'Click-Through Rate (CTR)': parseFloat((item.sumCTR / item.count).toFixed(2)),
          'Open Rate (OTR)': parseFloat((item.sumOR / item.count).toFixed(2)),
        };
      });
  }, [edmTasks]);

  if (loading || edmLoading) {
    return <div className="loader">Loading Dashboard...</div>;
  }

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="layout-wrapper">
        <div className="main-content-area">
          <header className="header glass-panel">
          <div className="header-title-area">
            <Activity size={32} color="#764393" />
            <h1>Creative & Digital Projects</h1>
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

        <div style={{ display: activeTab === 'requests' ? 'flex' : 'none', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
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
            <div className="kpi-info">
              <h3>Total Projects</h3>
              <div className="kpi-value">{stats.total}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-info">
              <h3>Avg. Projects Per Year</h3>
              <div className="kpi-value">{stats.avgProjectsPerYear}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-info">
              <h3>Avg. Projects Per Month</h3>
              <div className="kpi-value">{stats.avgProjectsPerMonth}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-info">
              <h3>Depts / Offices / Units</h3>
              <div className="kpi-value">{stats.uniqueDeptsCount}</div>
            </div>
          </div>

          <div className="kpi-card glass-panel">
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
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#764393' }}>Projects List</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555555', fontWeight: 500 }}>
              Showing {Math.min(15, filteredTasksForTable.length)} of {filteredTasksForTable.length} filtered Projects
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
            {/* PROJECT NAME Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                PROJECT NAME
              </label>
              <input
                type="text"
                placeholder="Search PROJECT NAME..."
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
                <th>PROJECT NAME</th>
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
                          {task['PROJECT NAME'] || 'Untitled'}
                        </td>
                        <td>{displayDept}</td>
                        <td>{task['Task type']}</td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#555555', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                    No Projects match your search criteria.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Column 1 */}
            <div className="table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Short Name</th>
                    <th>Department / Office / Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentViewDepartments.length > 0 ? (() => {
                    const DEPTS_PER_PAGE = 30; // Double capacity since it's 2 columns
                    const totalDeptPages = Math.ceil(currentViewDepartments.length / DEPTS_PER_PAGE);
                    const safeDeptPage = Math.max(1, Math.min(deptPage, totalDeptPages));
                    const paginatedDepts = currentViewDepartments.slice(
                      (safeDeptPage - 1) * DEPTS_PER_PAGE,
                      safeDeptPage * DEPTS_PER_PAGE
                    );
                    const halfLength = Math.ceil(paginatedDepts.length / 2);
                    const firstHalf = paginatedDepts.slice(0, halfLength);

                    return firstHalf.map((dept, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#764393', fontWeight: 600 }}>{dept.shortName}</td>
                        <td style={{ fontWeight: 600 }}>{dept.fullName}</td>
                      </tr>
                    ));
                  })() : (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '3rem', color: '#555555', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                        No active departments match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Column 2 */}
            <div className="table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Short Name</th>
                    <th>Department / Office / Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentViewDepartments.length > 0 ? (() => {
                    const DEPTS_PER_PAGE = 30; // Double capacity since it's 2 columns
                    const totalDeptPages = Math.ceil(currentViewDepartments.length / DEPTS_PER_PAGE);
                    const safeDeptPage = Math.max(1, Math.min(deptPage, totalDeptPages));
                    const paginatedDepts = currentViewDepartments.slice(
                      (safeDeptPage - 1) * DEPTS_PER_PAGE,
                      safeDeptPage * DEPTS_PER_PAGE
                    );
                    const halfLength = Math.ceil(paginatedDepts.length / 2);
                    const secondHalf = paginatedDepts.slice(halfLength);

                    return secondHalf.length > 0 ? secondHalf.map((dept, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#764393', fontWeight: 600 }}>{dept.shortName}</td>
                        <td style={{ fontWeight: 600 }}>{dept.fullName}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2} style={{ borderBottom: 'none' }}>&nbsp;</td>
                      </tr>
                    );
                  })() : (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', padding: '3rem', color: '#555555', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                        No active departments match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          {Math.ceil(currentViewDepartments.length / 30) > 1 && (() => {
            const DEPTS_PER_PAGE = 30;
            const totalDeptPages = Math.ceil(currentViewDepartments.length / DEPTS_PER_PAGE);
            const safeDeptPage = Math.max(1, Math.min(deptPage, totalDeptPages));
            const startIdx = (safeDeptPage - 1) * DEPTS_PER_PAGE + 1;
            const endIdx = Math.min(safeDeptPage * DEPTS_PER_PAGE, currentViewDepartments.length);

            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#555555', fontWeight: 600 }}>
                  Showing {startIdx} to {endIdx} of {currentViewDepartments.length} active departments
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setDeptPage(p => Math.max(1, p - 1))}
                    disabled={safeDeptPage === 1}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(118, 67, 147, 0.2)',
                      background: safeDeptPage === 1 ? 'rgba(118, 67, 147, 0.04)' : '#ffffff',
                      color: safeDeptPage === 1 ? '#999999' : '#764393',
                      fontWeight: 600,
                      cursor: safeDeptPage === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      transition: 'all 0.2s ease',
                      boxShadow: safeDeptPage === 1 ? 'none' : '0 2px 6px rgba(118, 67, 147, 0.08)'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setDeptPage(p => Math.min(totalDeptPages, p + 1))}
                    disabled={safeDeptPage === totalDeptPages}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(118, 67, 147, 0.2)',
                      background: safeDeptPage === totalDeptPages ? 'rgba(118, 67, 147, 0.04)' : '#ffffff',
                      color: safeDeptPage === totalDeptPages ? '#999999' : '#764393',
                      fontWeight: 600,
                      cursor: safeDeptPage === totalDeptPages ? 'not-allowed' : 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      transition: 'all 0.2s ease',
                      boxShadow: safeDeptPage === totalDeptPages ? 'none' : '0 2px 6px rgba(118, 67, 147, 0.08)'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
        </div> {/* closes requests activeTab wrapper */}

        <div style={{ display: activeTab === 'services' ? 'flex' : 'none', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Layers size={24} color="#764393" />
              <h3 style={{ fontSize: '1.65rem', margin: 0, color: '#222222' }}>Services Impact Overview</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
              Detailed metrics across key creative services to analyze total output and reach.
            </p>
          </div>

          {/* Quick Jump Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
            padding: '0.75rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'Montserrat, sans-serif' }}>
              <Layers size={14} color="#764393" /> Jump to Section:
            </span>
            <button
              onClick={() => document.getElementById('section-graphic-design')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(130, 117, 75, 0.1)',
                border: '1px solid rgba(130, 117, 75, 0.3)',
                color: '#82754B',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.15s ease'
              }}
            >
              <Palette size={14} /> Graphic Design Impact
            </button>
            <button
              onClick={() => document.getElementById('section-cuhk-visuals')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(118, 67, 147, 0.08)',
                border: '1px solid rgba(118, 67, 147, 0.25)',
                color: '#764393',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.15s ease'
              }}
            >
              <TrendingUp size={14} /> CUHK Visuals Impact
            </button>
            <button
              onClick={() => document.getElementById('section-dam')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(71, 40, 88, 0.08)',
                border: '1px solid rgba(71, 40, 88, 0.25)',
                color: '#472858',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.15s ease'
              }}
            >
              <TrendingUp size={14} /> DAM Impact
            </button>
            <button
              onClick={() => document.getElementById('section-edm')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(32, 191, 107, 0.08)',
                border: '1px solid rgba(32, 191, 107, 0.25)',
                color: '#82754B',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity size={14} /> eDM Campaign Impact
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SECTION: GRAPHIC DESIGN IMPACT (SOURCES: SOCIAL POST, SOUVENIR, ETC.)     */}
          {/* ========================================================================= */}
          <div id="section-graphic-design" className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(130, 117, 75, 0.15) 0%, rgba(118, 67, 147, 0.12) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(130, 117, 75, 0.3)',
                  boxShadow: '0 2px 8px rgba(130, 117, 75, 0.08)'
                }}>
                  <Palette size={24} color="#82754B" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.65rem', margin: 0, color: '#222222', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                      Graphic Design Impact
                    </h3>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      background: 'rgba(130, 117, 75, 0.12)',
                      color: '#82754B',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                      Creative Projects & Channels Audit
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
                    Analysis of design outputs by deliverable source & channel (Social Posts, Souvenirs & Merchandise, Publications, Events, Web Graphics, etc.) to evaluate what types of Graphic Design are requested.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  background: 'rgba(130, 117, 75, 0.08)',
                  color: '#82754B',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  fontFamily: 'Montserrat, sans-serif',
                  border: '1px solid rgba(130, 117, 75, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Sparkles size={14} color="#82754B" />
                  {graphicDesignData.total.toLocaleString()} Total Projects
                </span>
                <span style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  background: 'rgba(118, 67, 147, 0.08)',
                  color: '#764393',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  fontFamily: 'Montserrat, sans-serif',
                  border: '1px solid rgba(118, 67, 147, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Calendar size={14} color="#764393" />
                  Timeline: {selectedTimeline}
                </span>
              </div>
            </div>

            {/* Top KPI Cards for Graphic Design */}
            <div className="dashboard-grid">
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  Total Projects
                </h4>
                <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#82754B', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                  {graphicDesignData.total.toLocaleString()}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                  {graphicDesignData.completedCount} completed · {graphicDesignData.inProgressCount} in progress
                </span>
              </div>

              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  Top Source: Social Post
                </h4>
                <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#3B82F6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                  {graphicDesignData.sourceStats.find((s) => s.category === 'Social Post')?.count || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                  {graphicDesignData.sourceStats.find((s) => s.category === 'Social Post')?.percentage || 0}% of all design requests
                </span>
              </div>

              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  Souvenirs & Merchandise
                </h4>
                <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#F59E0B', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                  {graphicDesignData.sourceStats.find((s) => s.category === 'Souvenir & Merchandise')?.count || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                  Mooncake boxes, calendars, 60A gifts
                </span>
              </div>

              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                  Departments Reached
                </h4>
                <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#764393', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                  {graphicDesignData.uniqueDeptsCount}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                  Across faculties, CPRO & colleges
                </span>
              </div>
            </div>

            {/* Sub-Tab Navigation for Graphic Design */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'overview', label: 'Sources Overview & Trends' },
                { id: 'sources', label: 'Design Sources Spotlight ("What Types For")' },
                { id: 'explorer', label: `Projects Explorer (${filteredGraphicDesignTasks.length})` },
                { id: 'departments', label: 'Department Demand Matrix' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setGdActiveSubTab(tab.id as any);
                    if (tab.id === 'explorer') setGdPage(1);
                  }}
                  style={{
                    padding: '0.75rem 0.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: gdActiveSubTab === tab.id ? '3px solid #82754B' : '3px solid transparent',
                    color: gdActiveSubTab === tab.id ? '#82754B' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW & TRENDS */}
            {gdActiveSubTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {/* Left: Source Breakdown Donut Chart */}
                  <div style={{ flex: '1 1 48%', minWidth: '330px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                      Graphic Design Projects by Source
                    </div>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif' }}>
                      Distribution of outputs by format and purpose (Social Posts, Souvenirs, Events, Publications, etc.).
                    </p>
                    <div style={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <Pie
                            data={graphicDesignData.sourceStats.map((s) => ({
                              name: s.info.shortLabel,
                              value: s.count,
                              category: s.category,
                              color: s.info.color,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={{ stroke: '#82754B', strokeWidth: 1 }}
                            label={renderCustomPieLabel}
                            innerRadius={60}
                            outerRadius={105}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {graphicDesignData.sourceStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.info.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any, name: any) => {
                              const total = graphicDesignData.total;
                              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              return [`${value.toLocaleString()} projects (${percent}%)`, name];
                            }}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid rgba(130, 117, 75, 0.25)',
                              borderRadius: '12px',
                              fontFamily: 'Montserrat, sans-serif',
                              fontWeight: 500,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Source Badges Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      {graphicDesignData.sourceStats.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setGdSelectedCategory(s.category);
                            setGdActiveSubTab('explorer');
                            setGdPage(1);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '16px',
                            background: s.info.bg,
                            border: `1px solid ${s.info.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: s.info.color,
                            cursor: 'pointer',
                            fontFamily: 'Montserrat, sans-serif',
                            transition: 'transform 0.15s ease',
                          }}
                          title={`Click to filter Projects for ${s.category}`}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.info.color }}></span>
                          <span>{s.info.shortLabel}:</span>
                          <span style={{ fontWeight: 800 }}>{s.count} ({s.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Medium / Format Breakdown & Deliverable Channels */}
                  <div style={{ flex: '1 1 48%', minWidth: '330px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Format Breakdown Card */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                      <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>
                        Deliverable Medium (Digital vs. Print)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {graphicDesignData.formatBreakdown.map((item, idx) => {
                          const pct = graphicDesignData.total > 0 ? ((item.value / graphicDesignData.total) * 100).toFixed(1) : '0.0';
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                                <span style={{ fontWeight: 700, color: '#334155' }}>{item.name}</span>
                                <span style={{ fontWeight: 800, color: item.color }}>{item.value} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Volume AreaChart */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', flex: 1 }}>
                      <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                        Graphic Design Projects Over Time
                      </div>
                      <div style={{ height: 210 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={graphicDesignData.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorGDTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82754B" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#82754B" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(130, 117, 75, 0.08)" />
                            <XAxis dataKey="name" tick={{ fill: '#333333', fontSize: 10.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                            <YAxis tick={{ fill: '#333333', fontSize: 10.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                            <Tooltip wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="total" name="Projects" stroke="#82754B" fillOpacity={1} fill="url(#colorGDTotal)" strokeWidth={2.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SOURCES SPOTLIGHT ("WHAT TYPES OF GRAPHIC DESIGN FOR") */}
            {gdActiveSubTab === 'sources' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                    What Types of Graphic Design Are Requested?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
                    Every graphic design project is tailored to a specific channel, audience, and deliverable format. Select any category card to inspect and filter all Projects created for that source.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {graphicDesignData.sourceStats.map((s, idx) => {
                    const isSelected = gdSelectedCategory === s.category;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: isSelected ? `2px solid ${s.info.color}` : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: isSelected ? `0 6px 20px ${s.info.bg}` : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Card Header */}
                        <div style={{
                          padding: '1.25rem 1.5rem',
                          background: s.info.bg,
                          borderBottom: `1px solid ${s.info.border}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${s.info.border}`,
                            }}>
                              {s.category === 'Social Post' && <Share2 size={16} color={s.info.color} />}
                              {s.category === 'Souvenir & Merchandise' && <Gift size={16} color={s.info.color} />}
                              {s.category === 'Event & Exhibition' && <Calendar size={16} color={s.info.color} />}
                              {s.category === 'Publication & Editorial' && <BookOpen size={16} color={s.info.color} />}
                              {s.category === 'Digital & Web Graphics' && <Globe size={16} color={s.info.color} />}
                              {s.category === 'Media & Research Publicity' && <Megaphone size={16} color={s.info.color} />}
                              {s.category === 'Branding & Print Collateral' && <Tag size={16} color={s.info.color} />}
                              {s.category === 'General Creative Design' && <Palette size={16} color={s.info.color} />}
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                              {s.category}
                            </h4>
                          </div>

                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background: '#ffffff',
                            color: s.info.color,
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: `1px solid ${s.info.border}`,
                            fontFamily: 'Montserrat, sans-serif',
                          }}>
                            {s.count} ({s.percentage}%)
                          </span>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
                            {s.info.description}
                          </p>

                          <div>
                            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontFamily: 'Montserrat, sans-serif' }}>
                              Key Output Examples
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {s.info.examples.slice(0, 3).map((ex, exIdx) => (
                                <div key={exIdx} style={{ fontSize: '0.8rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.info.color }}></span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {s.topDepts.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontFamily: 'Montserrat, sans-serif' }}>
                                Top Requesting Units
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {s.topDepts.map((d, dIdx) => (
                                  <span key={dIdx} style={{ fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                                    {d.name} ({d.count})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              onClick={() => {
                                setGdSelectedCategory(s.category);
                                setGdActiveSubTab('explorer');
                                setGdPage(1);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '8px',
                                background: isSelected ? s.info.color : '#f8fafc',
                                color: isSelected ? '#ffffff' : s.info.color,
                                border: `1px solid ${isSelected ? s.info.color : s.info.border}`,
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontFamily: 'Montserrat, sans-serif',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Eye size={14} />
                              Explore {s.count} Projects
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Projects EXPLORER */}
            {gdActiveSubTab === 'explorer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Search & Filter Header */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  {/* Search bar & medium/status dropdowns */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                      <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search Projects by name, department, tags, handler, purpose..."
                        value={gdSearchQuery}
                        onChange={(e) => {
                          setGdSearchQuery(e.target.value);
                          setGdPage(1);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontFamily: 'Montserrat, sans-serif',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                          color: '#1e293b',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={gdMediumFilter}
                        onChange={(e) => {
                          setGdMediumFilter(e.target.value as any);
                          setGdPage(1);
                        }}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.825rem',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        <option value="All">All Formats (Digital & Print)</option>
                        <option value="Digital">Digital Only</option>
                        <option value="Print">Print Only</option>
                        <option value="Digital & Print">Hybrid (Digital & Print)</option>
                      </select>

                      <select
                        value={gdStatusFilter}
                        onChange={(e) => {
                          setGdStatusFilter(e.target.value as any);
                          setGdPage(1);
                        }}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.825rem',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Done">Completed Only</option>
                        <option value="In Progress">In Progress Only</option>
                      </select>

                      {(gdSelectedCategory !== 'All' || gdSearchQuery || gdMediumFilter !== 'All' || gdStatusFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setGdSelectedCategory('All');
                            setGdSearchQuery('');
                            setGdMediumFilter('All');
                            setGdStatusFilter('All');
                            setGdPage(1);
                          }}
                          style={{
                            padding: '0.65rem 0.9rem',
                            borderRadius: '8px',
                            background: '#e2e8f0',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#475569',
                            cursor: 'pointer',
                            fontFamily: 'Montserrat, sans-serif',
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Pills Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginRight: '0.25rem' }}>
                      Filter by Source:
                    </span>

                    <button
                      onClick={() => {
                        setGdSelectedCategory('All');
                        setGdPage(1);
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        background: gdSelectedCategory === 'All' ? '#82754B' : '#ffffff',
                        color: gdSelectedCategory === 'All' ? '#ffffff' : '#64748b',
                        border: '1px solid',
                        borderColor: gdSelectedCategory === 'All' ? '#82754B' : '#cbd5e1',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      All Sources ({graphicDesignData.total})
                    </button>

                    {graphicDesignData.sourceStats.map((s, idx) => {
                      const isSelected = gdSelectedCategory === s.category;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setGdSelectedCategory(s.category);
                            setGdPage(1);
                          }}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            background: isSelected ? s.info.color : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            border: '1px solid',
                            borderColor: isSelected ? s.info.color : '#cbd5e1',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Montserrat, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#ffffff' : s.info.color }}></span>
                          <span>{s.info.shortLabel} ({s.count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Results count label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                  <span>
                    Showing <strong style={{ color: '#1e293b' }}>{paginatedGdTasks.length}</strong> of <strong style={{ color: '#1e293b' }}>{filteredGraphicDesignTasks.length}</strong> Graphic Design Projects
                    {gdSelectedCategory !== 'All' && <span> in <strong style={{ color: '#82754B' }}>{gdSelectedCategory}</strong></span>}
                  </span>
                  <span>
                    Page {gdPage} of {gdTotalPages}
                  </span>
                </div>

                {/* Projects Table */}
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#334155' }}>Project Name</th>
                        <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#334155' }}>Design Source</th>
                        <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#334155' }}>Purpose / What It's For</th>
                        <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#334155' }}>Department / Unit</th>
                        <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#334155' }}>Format</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGdTasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                            No graphic design Projects match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedGdTasks.map((t, idx) => {
                          const catInfo = getGraphicDesignSource(t);
                          const dop = (t['digital or print'] || '').trim();
                          const taskId = `${t['PROJECT NAME'] || t['Task Name']}_${t['Created Date'] || t.Period}_${idx}`;
                          const isExpanded = expandedGdTaskId === taskId;

                          return (
                            <>
                              <tr
                                key={idx}
                                onClick={() => setExpandedGdTaskId(isExpanded ? null : taskId)}
                                style={{
                                  borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                                  background: isExpanded ? 'rgba(130, 117, 75, 0.04)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s',
                                }}
                              >
                                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1e293b', maxWidth: '240px', wordBreak: 'break-word' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span>{t['PROJECT NAME'] || t['Task Name'] || 'Untitled Design'}</span>
                                    {t.Tags && (
                                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.Tags}>
                                        #{t.Tags.split(/[,;]/).map((x: string) => x.trim()).filter(Boolean).slice(0, 3).join(' #')}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: catInfo.bg,
                                    color: catInfo.color,
                                    border: `1px solid ${catInfo.border}`,
                                  }}>
                                    {catInfo.category === 'Social Post' && <Share2 size={12} />}
                                    {catInfo.category === 'Souvenir & Merchandise' && <Gift size={12} />}
                                    {catInfo.category === 'Event & Exhibition' && <Calendar size={12} />}
                                    {catInfo.category === 'Publication & Editorial' && <BookOpen size={12} />}
                                    {catInfo.category === 'Digital & Web Graphics' && <Globe size={12} />}
                                    {catInfo.category === 'Media & Research Publicity' && <Megaphone size={12} />}
                                    {catInfo.category === 'Branding & Print Collateral' && <Tag size={12} />}
                                    {catInfo.category === 'General Creative Design' && <Palette size={12} />}
                                    {catInfo.shortLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                                  <div style={{
                                    fontSize: '0.8rem',
                                    color: '#334155',
                                    fontWeight: 500,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }} title={t['Objectives '] || t.Tags || 'Institutional design request'}>
                                    {t['Objectives ']?.trim() || t.Tags || 'Institutional graphic design request'}
                                  </div>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t['Department/ Office'] || t['Dpt/ Office']}>
                                  {t['Department/ Office'] || t['Dpt/ Office'] || 'Unassigned'}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                                  <span style={{
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                    background: dop.toLowerCase().includes('print') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                    color: dop.toLowerCase().includes('print') ? '#d97706' : '#2563eb',
                                    border: `1px solid ${dop.toLowerCase().includes('print') ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                                  }}>
                                    {dop || 'Digital'}
                                  </span>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr key={`${idx}-expanded`} style={{ background: 'rgba(130, 117, 75, 0.03)', borderBottom: '2px solid rgba(130, 117, 75, 0.2)' }}>
                                  <td colSpan={5} style={{ padding: '1.25rem 1.5rem' }}>
                                    <div style={{
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      padding: '1.25rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.85rem',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#82754B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>
                                            Design Deliverable & Purpose Brief
                                          </div>
                                          <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', color: '#1e293b', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                                            {t['PROJECT NAME'] || t['Task Name']}
                                          </h4>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: catInfo.color, background: catInfo.bg, padding: '0.2rem 0.6rem', borderRadius: '12px', border: `1px solid ${catInfo.border}` }}>
                                            Source: {catInfo.category}
                                          </span>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                                            {formatPeriod(t.Period) || t.Period}
                                          </span>
                                        </div>
                                      </div>

                                      <div>
                                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontFamily: 'Montserrat, sans-serif' }}>
                                          What This Graphic Design Was For (Objectives):
                                        </div>
                                        <div style={{
                                          fontSize: '0.85rem',
                                          color: '#1e293b',
                                          lineHeight: 1.6,
                                          background: '#f8fafc',
                                          padding: '0.85rem 1rem',
                                          borderRadius: '6px',
                                          border: '1px solid #e2e8f0',
                                          whiteSpace: 'pre-wrap',
                                          fontFamily: 'Montserrat, sans-serif',
                                          fontWeight: 500
                                        }}>
                                          {t['Objectives '] || 'No detailed written brief provided. Categorized by design keywords and distribution channel tags.'}
                                        </div>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '0.5rem' }}>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Channels & Platforms</div>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem', fontFamily: 'Montserrat, sans-serif' }}>
                                            {t['For this Platform'] || 'Direct Production / Campus Collateral'}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Requesting Department</div>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem', fontFamily: 'Montserrat, sans-serif' }}>
                                            {t['Department/ Office'] || t['Dpt/ Office'] || 'Unassigned'}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Format & Color Scheme</div>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem', fontFamily: 'Montserrat, sans-serif' }}>
                                            {dop || 'Digital'} {t.Resolution ? `· ${t.Resolution}` : ''} {t['Colour Scheme'] ? `· ${t['Colour Scheme']}` : ''}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Handler & Manager</div>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: '0.2rem', fontFamily: 'Montserrat, sans-serif' }}>
                                            Handler: {t.Handler || 'Unassigned'} {t['Project Owner/Manager'] ? `(Owner: ${t['Project Owner/Manager']})` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {t['Supplied Text'] && (
                                        <div style={{ paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Supplied Text / Copy Brief:</div>
                                          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'Montserrat, sans-serif' }}>
                                            {t['Supplied Text']}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {gdTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      disabled={gdPage === 1}
                      onClick={() => setGdPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '6px',
                        background: gdPage === 1 ? '#f1f5f9' : '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: gdPage === 1 ? '#94a3b8' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: gdPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', fontFamily: 'Montserrat, sans-serif' }}>
                      Page {gdPage} of {gdTotalPages}
                    </span>

                    <button
                      disabled={gdPage === gdTotalPages}
                      onClick={() => setGdPage((p) => Math.min(gdTotalPages, p + 1))}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '6px',
                        background: gdPage === gdTotalPages ? '#f1f5f9' : '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: gdPage === gdTotalPages ? '#94a3b8' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: gdPage === gdTotalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DEPARTMENT DEMAND MATRIX */}
            {gdActiveSubTab === 'departments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                    Which Departments Request What Types of Graphic Design?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
                    Demand distribution showing how internal and external university departments consume graphic design resources across Souvenirs, Social Posts, Publications, and Events.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {graphicDesignData.topDepartments.map((dept, idx) => {
                    const deptTasks = graphicDesignData.allTasks.filter((t) => {
                      const d = t['Department/ Office']?.trim() || t['Dpt/ Office']?.trim() || 'Unassigned';
                      return d === dept.name;
                    });
                    const deptTotal = deptTasks.length;
                    const catCounts: Record<string, number> = {};
                    deptTasks.forEach((t) => {
                      const cat = getGraphicDesignSource(t).shortLabel;
                      catCounts[cat] = (catCounts[cat] || 0) + 1;
                    });
                    const sortedCatCounts = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82754B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>
                              #{idx + 1} Requisition Unit
                            </span>
                            <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', color: '#1e293b', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
                              {dept.name}
                            </h4>
                          </div>
                          <span style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '14px',
                            background: 'rgba(130, 117, 75, 0.1)',
                            color: '#82754B',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            fontFamily: 'Montserrat, sans-serif',
                          }}>
                            {deptTotal} projects
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontFamily: 'Montserrat, sans-serif' }}>
                            Top Design Types Requested
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {sortedCatCounts.slice(0, 4).map(([catName, count], cIdx) => {
                              const share = ((count / deptTotal) * 100).toFixed(0);
                              return (
                                <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontFamily: 'Montserrat, sans-serif' }}>
                                  <span style={{ fontWeight: 600, color: '#334155' }}>{catName}</span>
                                  <span style={{ fontWeight: 800, color: '#764393' }}>{count} ({share}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                          <button
                            onClick={() => {
                              setGdSearchQuery(dept.name);
                              setGdSelectedCategory('All');
                              setGdActiveSubTab('explorer');
                              setGdPage(1);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#82754B',
                              fontWeight: 700,
                              fontSize: '0.775rem',
                              cursor: 'pointer',
                              fontFamily: 'Montserrat, sans-serif',
                            }}
                          >
                            Filter All Projects for {dept.name}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CUHK Visuals & DAM Impact Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%' }}>
            {visualsLoading && (
              <div className="glass-panel" style={{ padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                <div className="loader" style={{
                  border: '4px solid rgba(118, 67, 147, 0.1)',
                  borderTop: '4px solid #764393',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                  Analyzing 204,239 records to build Journey of Influence...
                </span>
              </div>
            )}

            {visualsError && (
              <div className="glass-panel" style={{ padding: '2rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>
                {visualsError}
              </div>
            )}

            {visualsSummary && !visualsLoading && (() => {
              // Calculate CUHK Visuals scope metrics
              const c_summary = visualsSummary.cuhkVisuals.summary;
              const c_combinedDownloads = c_summary.totalDownloads + cuhkVisualsAssetRequests.length;
              const c_totalShares = c_summary.totalShares || 0;
              const c_totalDistribution = c_combinedDownloads + c_totalShares;
              const c_combinedConversionRate = c_summary.totalPreviews > 0
                ? ((c_totalDistribution / c_summary.totalPreviews) * 100).toFixed(2) + '%'
                : '0.00%';

              // Calculate DAM scope metrics
              const d_summary = visualsSummary.dam.summary;
              const d_totalShares = d_summary.totalShares || 0;
              const d_totalDistribution = d_summary.totalDownloads + d_totalShares;
              const d_combinedConversionRate = d_summary.totalPreviews > 0
                ? ((d_totalDistribution / d_summary.totalPreviews) * 100).toFixed(2) + '%'
                : '0.00%';

              return (
                <>
                  {/* SECTION 1: CUHK VISUALS IMPACT */}
                  <div id="section-cuhk-visuals" className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp size={24} color="#764393" />
                        <h3 style={{ fontSize: '1.65rem', margin: 0, color: '#222222', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>CUHK Visuals Impact</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
                        Live audit of public-facing creative materials, wallpapers, and photo-contest assets. Sourced from CUHK Visuals, 中大視野, and 活動素材上載.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                      {/* Visual Funnel Flow */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(118, 67, 147, 0.03) 0%, rgba(32, 191, 107, 0.03) 100%)',
                        padding: '2.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(118, 67, 147, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                      }}>
                      {/* Step 1 */}
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#764393', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>1. Entry Point</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#764393', fontFamily: 'Montserrat, sans-serif' }}>
                            {c_summary.totalEvents.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Total Engagements / Logs</span>
                        </div>

                        {/* Arrow 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#764393" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#764393', fontFamily: 'Montserrat, sans-serif' }}>
                            {((c_summary.totalPreviews / c_summary.totalEvents) * 100).toFixed(1)}% Preview Rate
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9174A8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>2. Preview Step</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9174A8', fontFamily: 'Montserrat, sans-serif' }}>
                            {c_summary.totalPreviews.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Asset Full-Screen Previews</span>
                        </div>

                        {/* Arrow 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#82754B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82754B', fontFamily: 'Montserrat, sans-serif' }}>
                            {c_combinedConversionRate} Conversion
                          </span>
                        </div>

                        {/* Step 3 */}
                        <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem', background: 'rgba(32, 191, 107, 0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(32, 191, 107, 0.15)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82754B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>3. Downloads & Shares Stat</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#82754B', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.1 }}>
                            {c_totalDistribution.toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.35rem', marginTop: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(32, 191, 107, 0.2)', paddingBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>3.1 "Download Image" (Log)</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#82754B', fontFamily: 'Montserrat, sans-serif' }}>{c_summary.totalDownloads.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(32, 191, 107, 0.2)', paddingBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>3.2 Asset Request (Projects)</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#764393', fontFamily: 'Montserrat, sans-serif' }}>{cuhkVisualsAssetRequests.length.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>3.3 "Share Image" (Log)</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9b7d46', fontFamily: 'Montserrat, sans-serif' }}>{c_totalShares.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Tab Segmented Controls */}
                      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {['overview', 'previews', 'downloads', 'shares', 'journey', 'attributes'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setVisualsSubTab(tab as any)}
                            style={{
                              padding: '0.75rem 0.5rem',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: visualsSubTab === tab ? '3px solid #764393' : '3px solid transparent',
                              color: visualsSubTab === tab ? '#764393' : '#64748b',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              textTransform: 'capitalize',
                              transition: 'all 0.2s',
                              fontFamily: 'Montserrat, sans-serif'
                            }}
                          >
                            {tab === 'overview' ? 'Group View & Trends' : tab === 'attributes' ? 'User Attributes' : `${tab} log`}
                          </button>
                        ))}
                      </div>

                      {/* Sub-Tab Contents for CUHK Visuals */}
                      {visualsSubTab === 'overview' && (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 55%', minWidth: '350px' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>CUHK Visuals Engagement Trend</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visualsSummary.cuhkVisuals.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorCVisPreviews" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#9174A8" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#9174A8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCVisDownloads" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#82754B" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#82754B" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCVisShares" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#9b7d46" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#9b7d46" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(118, 67, 147, 0.08)" />
                                  <XAxis dataKey="name" tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <YAxis tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <Tooltip wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }} />
                                  <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <Area type="monotone" dataKey="preview" name="Previews" stroke="#9174A8" fillOpacity={1} fill="url(#colorCVisPreviews)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="download" name="Downloads" stroke="#82754B" fillOpacity={1} fill="url(#colorCVisDownloads)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="share" name="Shares" stroke="#9b7d46" fillOpacity={1} fill="url(#colorCVisShares)" strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div style={{ flex: '1 1 35%', minWidth: '280px' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Group Activity by Location</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {visualsSummary.cuhkVisuals.locations.map((loc: any, idx: number) => (
                                <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>{loc.location}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#764393', background: 'rgba(118, 67, 147, 0.08)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif' }}>
                                      {loc.total.toLocaleString()} events
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.825rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Previews</span>
                                      <span style={{ color: '#9174A8', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.preview.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Downloads</span>
                                      <span style={{ color: '#82754B', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.download.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Shares</span>
                                      <span style={{ color: '#9b7d46', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.share.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {visualsSubTab === 'previews' && (
                        <div>
                          <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Most Discoverable / Previewed Creative Assets</div>
                          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Total Previews</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualsSummary.cuhkVisuals.topPreviews.slice(0, 15).map((file: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '400px' }}>{file.file}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#9174A8', fontWeight: 800 }}>{file.preview.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {visualsSubTab === 'downloads' && (
                        <div>
                          <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Most Influential / Downloaded Creative Assets</div>
                          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Total Downloads</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualsSummary.cuhkVisuals.topDownloads.slice(0, 15).map((file: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '400px' }}>{file.file}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#82754B', fontWeight: 800 }}>{file.download.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {visualsSubTab === 'shares' && (() => {
                        const topShares = [...visualsSummary.cuhkVisuals.journeyOfInfluence]
                          .filter((file: any) => file.share > 0)
                          .sort((a: any, b: any) => b.share - a.share)
                          .slice(0, 15);

                        return (
                          <div>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Most Shared CUHK Visuals Assets</div>
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Total Shares</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {topShares.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                        No sharing logs recorded in current timeline.
                                      </td>
                                    </tr>
                                  ) : (
                                    topShares.map((file: any, idx: number) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '400px' }}>{file.file}</td>
                                        <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#9b7d46', fontWeight: 800 }}>{file.share.toLocaleString()}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {visualsSubTab === 'journey' && (() => {
                        const sortedJourney = [...visualsSummary.cuhkVisuals.journeyOfInfluence]
                          .sort((a: any, b: any) => {
                            const rateA = parseFloat((a.conversionRate || '0').replace('%', ''));
                            const rateB = parseFloat((b.conversionRate || '0').replace('%', ''));
                            if (rateB !== rateA) return rateB - rateA;
                            return (b.score || 0) - (a.score || 0);
                          })
                          .slice(0, 15);

                        return (
                          <div>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>The Creative Discovery Journey</div>
                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
                              Tracing how individual files are discovered (Previewed), requested, and distributed (Downloaded/Shared). Sorted by conversion rate.
                            </p>
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Previews</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Downloads</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Shares</th>
                                    <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Conversion</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedJourney.map((file: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                      <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '300px' }}>{file.file}</td>
                                      <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center', color: '#9174A8', fontWeight: 800 }}>{file.preview.toLocaleString()}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center', color: '#82754B', fontWeight: 800 }}>{file.download.toLocaleString()}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center', color: '#9b7d46', fontWeight: 800 }}>{file.share.toLocaleString()}</td>
                                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                          display: 'inline-block',
                                          padding: '0.15rem 0.5rem',
                                          borderRadius: '12px',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          background: parseFloat(file.conversionRate) > 30 ? 'rgba(32, 191, 107, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                          color: parseFloat(file.conversionRate) > 30 ? '#82754B' : '#64748b'
                                        }}>
                                          {file.conversionRate}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {visualsSubTab === 'attributes' && (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 45%', minWidth: '320px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>Activity by Page</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                  <Pie
                                    data={visualsSummary.cuhkVisuals.locations.map((loc: any) => ({ name: loc.location, value: loc.total }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={{ stroke: '#764393', strokeWidth: 1 }}
                                    label={renderCustomPieLabel}
                                    innerRadius={60}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {visualsSummary.cuhkVisuals.locations.map((_entry: any, index: number) => {
                                      const colors = ['#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#f7b731', '#eb3b5a', '#a55eea', '#2bcbba', '#a5b1c2'];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: any, name: any) => {
                                      const total = c_summary.totalEvents;
                                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                      return [`${value.toLocaleString()} events (${percent}%)`, name];
                                    }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(118, 67, 147, 0.25)', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
                                  />
                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div style={{ flex: '1 1 45%', minWidth: '320px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>Activity by User Profile</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                  <Pie
                                    data={visualsSummary.cuhkVisuals.users}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={{ stroke: '#764393', strokeWidth: 1 }}
                                    label={renderCustomPieLabel}
                                    innerRadius={60}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {visualsSummary.cuhkVisuals.users.map((_entry: any, index: number) => {
                                      const colors = ['#472858', '#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#eb3b5a', '#4b6584'];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: any, name: any) => {
                                      const total = c_summary.totalEvents;
                                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                      return [`${value.toLocaleString()} events (${percent}%)`, name];
                                    }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(118, 67, 147, 0.25)', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
                                  />
                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: DAM IMPACT */}
                  <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp size={24} color="#472858" />
                        <h3 style={{ fontSize: '1.65rem', margin: 0, color: '#222222', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>DAM Impact</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
                        Live audit of internal systems, archives, document folders, and general files. Sourced from Main Library and Congratulatory Messages to VC.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                      {/* Visual Funnel Flow */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(71, 40, 88, 0.03) 0%, rgba(32, 191, 107, 0.03) 100%)',
                        padding: '2.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(71, 40, 88, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                      }}>
                        {/* Step 1 */}
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#472858', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>1. Entry Point</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#472858', fontFamily: 'Montserrat, sans-serif' }}>
                            {d_summary.totalEvents.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Total Engagements / Logs</span>
                        </div>

                        {/* Arrow 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#472858" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#472858', fontFamily: 'Montserrat, sans-serif' }}>
                            {((d_summary.totalPreviews / d_summary.totalEvents) * 100).toFixed(1)}% Preview Rate
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9174A8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>2. Preview Step</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9174A8', fontFamily: 'Montserrat, sans-serif' }}>
                            {d_summary.totalPreviews.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Asset Full-Screen Previews</span>
                        </div>

                        {/* Arrow 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#82754B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82754B', fontFamily: 'Montserrat, sans-serif' }}>
                            {d_combinedConversionRate} Conversion
                          </span>
                        </div>

                        {/* Step 3 */}
                        <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem', background: 'rgba(32, 191, 107, 0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(32, 191, 107, 0.15)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82754B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Montserrat, sans-serif' }}>3. Distribution Stat</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#82754B', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.1 }}>
                            {d_totalDistribution.toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.35rem', marginTop: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(32, 191, 107, 0.2)', paddingBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>3.1 Downloads (Log)</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#82754B', fontFamily: 'Montserrat, sans-serif' }}>{d_summary.totalDownloads.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>3.2 Shares / Channels (Log)</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#472858', fontFamily: 'Montserrat, sans-serif' }}>{d_totalShares.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed KPI Row */}
                      <div className="dashboard-grid">
                        <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Total Engagements</h4>
                          <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#472858', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                            {d_summary.totalEvents.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Sourced from DAM admin logs</span>
                        </div>
                        <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Asset Previews</h4>
                          <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#9174A8', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                            {d_summary.totalPreviews.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Full-resolution views</span>
                        </div>
                        <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Asset Downloads</h4>
                          <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#82754B', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                            {d_summary.totalDownloads.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Direct folder downloads</span>
                        </div>
                        <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Previews-to-Download</h4>
                          <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#9b7d46', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                            {d_combinedConversionRate}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Direct conversion rate</span>
                        </div>
                      </div>

                      {/* Sub-Tab Segmented Controls */}
                      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {['overview', 'previews', 'downloads', 'journey', 'attributes'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setDamSubTab(tab as any)}
                            style={{
                              padding: '0.75rem 0.5rem',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: damSubTab === tab ? '3px solid #472858' : '3px solid transparent',
                              color: damSubTab === tab ? '#472858' : '#64748b',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              textTransform: 'capitalize',
                              transition: 'all 0.2s',
                              fontFamily: 'Montserrat, sans-serif'
                            }}
                          >
                            {tab === 'overview' ? 'Group View & Trends' : tab === 'attributes' ? 'User Attributes Engagement' : `${tab} log`}
                          </button>
                        ))}
                      </div>

                      {/* Sub-Tab Contents for DAM */}
                      {damSubTab === 'overview' && (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 55%', minWidth: '350px' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>DAM Engagement Trend</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visualsSummary.dam.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorDamPreviews" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#9174A8" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#9174A8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDamDownloads" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#82754B" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#82754B" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(71, 40, 88, 0.08)" />
                                  <XAxis dataKey="name" tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <YAxis tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <Tooltip wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }} />
                                  <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                  <Area type="monotone" dataKey="preview" name="Previews" stroke="#9174A8" fillOpacity={1} fill="url(#colorDamPreviews)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="download" name="Downloads" stroke="#82754B" fillOpacity={1} fill="url(#colorDamDownloads)" strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div style={{ flex: '1 1 35%', minWidth: '280px' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Group Activity by Location</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {visualsSummary.dam.locations.slice(0, 5).map((loc: any, idx: number) => (
                                <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif' }}>{loc.location}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#472858', background: 'rgba(71, 40, 88, 0.08)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif' }}>
                                      {loc.total.toLocaleString()} events
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.825rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Previews</span>
                                      <span style={{ color: '#9174A8', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.preview.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Downloads</span>
                                      <span style={{ color: '#82754B', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.download.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>Shares</span>
                                      <span style={{ color: '#9b7d46', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{loc.share.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {damSubTab === 'previews' && (
                        <div>
                          <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Most Discoverable / Previewed DAM Assets</div>
                          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Total Previews</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualsSummary.dam.topPreviews.slice(0, 15).map((file: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '400px' }}>{file.file}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#9174A8', fontWeight: 800 }}>{file.preview.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {damSubTab === 'downloads' && (
                        <div>
                          <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 700 }}>Most Influential / Downloaded DAM Assets</div>
                          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Total Downloads</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualsSummary.dam.topDownloads.slice(0, 15).map((file: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '400px' }}>{file.file}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#82754B', fontWeight: 800 }}>{file.download.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {damSubTab === 'journey' && (
                        <div>
                          <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>The DAM Asset Discovery Journey</div>
                          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#64748b', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
                            Tracing how individual files are discovered (Previewed), organized, and distributed (Downloaded/Shared). Sorted by overall engagement score.
                          </p>
                          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem', fontFamily: 'Montserrat, sans-serif' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Asset Name</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155' }}>Size</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Previews</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Downloads</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Shares</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'center' }}>Conversion</th>
                                  <th style={{ padding: '1rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualsSummary.dam.journeyOfInfluence.slice(0, 15).map((file: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all', maxWidth: '300px' }}>{file.file}</td>
                                    <td style={{ padding: '1rem', color: '#64748b', fontWeight: 600 }}>{file.size || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#9174A8', fontWeight: 800 }}>{file.preview.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#82754B', fontWeight: 800 }}>{file.download.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: '#9b7d46', fontWeight: 800 }}>{file.share.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: parseFloat(file.conversionRate) > 30 ? 'rgba(32, 191, 107, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                        color: parseFloat(file.conversionRate) > 30 ? '#82754B' : '#64748b'
                                      }}>
                                        {file.conversionRate}
                                      </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#472858' }}>{file.score.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {damSubTab === 'attributes' && (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 45%', minWidth: '320px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>Activity by Page</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                  <Pie
                                    data={visualsSummary.dam.locations.slice(0, 8).map((loc: any) => ({ name: loc.location, value: loc.total }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={{ stroke: '#472858', strokeWidth: 1 }}
                                    label={renderCustomPieLabel}
                                    innerRadius={60}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {visualsSummary.dam.locations.slice(0, 8).map((_entry: any, index: number) => {
                                      const colors = ['#472858', '#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#eb3b5a', '#4b6584'];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: any, name: any) => {
                                      const total = d_summary.totalEvents;
                                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                      return [`${value.toLocaleString()} events (${percent}%)`, name];
                                    }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(71, 40, 88, 0.25)', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
                                  />
                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div style={{ flex: '1 1 45%', minWidth: '320px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 700 }}>Activity by User Profile</div>
                            <div style={{ height: 350 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                  <Pie
                                    data={visualsSummary.dam.users}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={{ stroke: '#472858', strokeWidth: 1 }}
                                    label={renderCustomPieLabel}
                                    innerRadius={60}
                                    outerRadius={110}
                                    paddingAngle={2}
                                    dataKey="value"
                                  >
                                    {visualsSummary.dam.users.map((_entry: any, index: number) => {
                                      const colors = ['#472858', '#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#eb3b5a', '#4b6584'];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: any, name: any) => {
                                      const total = d_summary.totalEvents;
                                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                      return [`${value.toLocaleString()} events (${percent}%)`, name];
                                    }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(71, 40, 88, 0.25)', borderRadius: '12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
                                  />
                                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>          {/* CUHK in Focus eDM Campaign Impact */}
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={24} color="#764393" />
                <h3 style={{ fontSize: '1.65rem', margin: 0, color: '#222222' }}>eDM Campaign Impact (CUHK in Focus)</h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
                Live audit of {edmSummary.totalCampaigns} email campaigns to track audience engagement and reach.
              </p>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Open Rate (OTR)</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#764393' }}>{edmSummary.avgOR}%</div>
                </div>
              </div>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Click-Through (CTR)</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#82754B' }}>{edmSummary.avgCTR}%</div>
                </div>
              </div>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Opens</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#9b7d46' }}>{(edmSummary.totalOpens / 1000000).toFixed(2)}M</div>
                </div>
              </div>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Delivered</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#333333' }}>{(edmSummary.totalDelivered / 1000000).toFixed(2)}M</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Opens / Issue</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#9b7d46' }}>
                    {Math.round(edmSummary.avgOpensPerIssue).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Click-Through / Issue</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#82754B' }}>
                    {Math.round(edmSummary.avgClicksPerIssue).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="kpi-card glass-panel" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
                <div className="kpi-info" style={{ flex: 1 }}>
                  <h3 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Delivered / Issue</h3>
                  <div className="kpi-value" style={{ fontSize: '1.85rem', color: '#333333' }}>
                    {Math.round(edmSummary.avgDeliveredPerIssue).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div style={{ flex: '1 1 100%', minWidth: '400px' }}>
                <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Engagement Trend Over Time</div>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={edmPerformanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#764393" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#764393" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCTR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82754B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#82754B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(118, 67, 147, 0.08)" />
                      <XAxis dataKey="name" tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#333333', fontSize: 11, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                      <Tooltip wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }} />
                      <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12.5, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }} />
                      <Area yAxisId="left" type="monotone" dataKey="Open Rate (OTR)" stroke="#764393" fillOpacity={1} fill="url(#colorOR)" strokeWidth={2} />
                      <Area yAxisId="right" type="monotone" dataKey="Click-Through Rate (CTR)" stroke="#82754B" fillOpacity={1} fill="url(#colorCTR)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>OTR by Target List</div>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={edmSummary.audienceBreakdown.map(item => ({ name: item.target, value: item.or }))}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: '#764393', strokeWidth: 1 }}
                        label={renderCustomPieLabel}
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {edmSummary.audienceBreakdown.map((_entry, index) => {
                          const colors = ['#472858', '#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#eb3b5a', '#4b6584'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                <div className="service-section-title" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>CTR by Target List</div>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={edmSummary.audienceBreakdown.map(item => ({ name: item.target, value: item.ctr }))}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: '#82754B', strokeWidth: 1 }}
                        label={renderCustomPieLabel}
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {edmSummary.audienceBreakdown.map((_entry, index) => {
                          const colors = ['#472858', '#764393', '#9174A8', '#9b7d46', '#82754B', '#2d98da', '#eb3b5a', '#4b6584'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} wrapperStyle={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div> {/* closes main-content-area */}

        <aside className="right-sidebar">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid rgba(118, 67, 147, 0.15)', paddingBottom: '1.5rem' }}>
            <Activity size={24} color="#764393" />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.9rem', color: '#764393', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              DC PERFORMANCE
            </span>
          </div>

          <div className="nav-title">Navigation</div>
          <div className="nav-group">
            <button
              className={`nav-button ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <ListTodo size={20} />
              Fulfilling Requests
            </button>
            <button
              className={`nav-button ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <Layers size={20} />
              Services Impacted
            </button>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(118, 67, 147, 0.15)', paddingTop: '1.5rem', fontSize: '0.8rem', color: '#777777', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
            <div>Role: Creative & Digital</div>
            <div style={{ marginTop: '0.25rem' }}>System Integrity: 100%</div>
          </div>
        </aside>
      </div> {/* closes layout-wrapper */}
    </>
  );
}

export default App;
