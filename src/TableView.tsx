import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- INTERFACES ---
interface ApiStudentEntry {
  name: string;
  mail?: string;
  group_id: string;
  ta?: string;
  attendance?: string;
  fa?: number;
  fb?: number;
  fc?: number;
  fd?: number;
  bonus_attempt?: number;
  bonus_answer_quality?: number;
  bonus_follow_up?: number;
  exercise_submitted?: string;
  exercise_test_passing?: string;
  exercise_good_documentation?: string;
  exercise_good_structure?: string;
  week: number;
  total?: number;
}

interface TableRowData {
  id: number;
  name: string;
  email?: string;
  group: string;
  ta: string;
  attendance: boolean;
  gdScore: { fa: number; fb: number; fc: number; fd: number };
  bonusScore: { attempt: number; good: number; followUp: number };
  exerciseScore: { Submitted: boolean; privateTest: boolean; goodStructure: boolean; goodDoc: boolean };
  week?: number;
  total: number;
}

const initialNewStudentFormStateProto: Omit<TableRowData, 'id' | 'total' | 'week' | 'group'> = {
  name: '',
  email: '',
  ta: '',
  attendance: false,
  gdScore: { fa: 0, fb: 0, fc: 0, fd: 0 },
  bonusScore: { attempt: 0, good: 0, followUp: 0 },
  exerciseScore: { Submitted: false, privateTest: false, goodStructure: false, goodDoc: false },
};

// --- COMPONENT ---
const TableView: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [data, setData] = useState<TableRowData[]>([]);
  const [editedRows, setEditedRows] = useState<TableRowData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [week, setWeek] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TableRowData | null; direction: 'ascending' | 'descending' }>({
    key: null,
    direction: 'ascending',
  });
  const [selectedGroup, setSelectedGroup] = useState<string>('All Groups');
  const [selectedTA, setSelectedTA] = useState<string>('All TAs');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [showTableRowForm, setShowTableRowForm] = useState(false);
  const baseGroups = useMemo(() => ['Group 0', 'Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'], []);
  const [newStudent, setNewStudent] = useState<Omit<TableRowData, 'id' | 'total' | 'week'>>({
    ...initialNewStudentFormStateProto,
    group: baseGroups[0] || 'Group 0',
  });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetId: number | null; }>({ visible: false, x: 0, y: 0, targetId: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ week: number; attended: number; }>({ week: 0, attended: 0 });

  const canEditFields = isEditing && week !== 0;
  const navigate = useNavigate();

  const handleStudentClick = (studentName: string) => {
    navigate(`/student?student=${encodeURIComponent(studentName)}`);
  };

  // --- DATA COMPUTATION & FETCHING ---
  const computeGdTotal = useCallback((gd: TableRowData['gdScore']): number =>
    (30 / 5) * gd.fa + (30 / 5) * gd.fb + (20 / 5) * gd.fc + (20 / 5) * gd.fd, []);

  const computeBonusTotal = useCallback((b: TableRowData['bonusScore']): number =>
    10 * b.attempt + 10 * b.good + 10 * b.followUp, []);

  const computeExerciseTotal = useCallback((e: TableRowData['exerciseScore']): number =>
    (e.Submitted ? 10 : 0) + (e.privateTest ? 50 : 0) + (e.goodDoc ? 20 : 0) + (e.goodStructure ? 20 : 0), []);

  const computeTotal = useCallback((p: Omit<TableRowData, 'id' | 'total' | 'week'> | TableRowData): number =>
    computeGdTotal(p.gdScore) + computeBonusTotal(p.bonusScore) + computeExerciseTotal(p.exerciseScore),
    [computeGdTotal, computeBonusTotal, computeExerciseTotal]
  );

  const TOKEN  = "token-mpzbqlbbxtjrjyxcwigsexdqadxmgumdizmnpwocfdobjkfdxwhflnhvavplpgyxtsplxisvxalvwgvjwdyvusvalapxeqjdhnsyoyhywcdwucshdoyvefpnobnslqfg";

  const fetchWeeklyData = useCallback((selectedWeek: number) => {
    fetch(`https://admin.bitshala.org/weekly_data/${selectedWeek}`, {
      headers: {
        'Authorization': `${TOKEN}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            let errorDetail = text;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            try { const jsonError = JSON.parse(text); errorDetail = jsonError.message || text; } catch (e) { /* ignore */ }
            throw new Error(`Server error: ${response.status} - ${errorDetail}`);
          });
        }
        return response.json();
      })
      .then((apiData: ApiStudentEntry[]) => {
        const formattedData = apiData.map((person, index) => {
          const gdScore = { fa: person.fa || 0, fb: person.fb || 0, fc: person.fc || 0, fd: person.fd || 0 };
          const bonusScore = { attempt: person.bonus_attempt || 0, good: person.bonus_answer_quality || 0, followUp: person.bonus_follow_up || 0 };
          const exerciseScore = {
            Submitted: person.exercise_submitted === 'yes', privateTest: person.exercise_test_passing === 'yes',
            goodStructure: person.exercise_good_structure === 'yes', goodDoc: person.exercise_good_documentation === 'yes',
          };
          const rowDataShape: Omit<TableRowData, 'id' | 'total'> = {
            name: person.name, email: person.mail, group: person.group_id, ta: person.ta || 'N/A',
            attendance: person.attendance === 'yes', gdScore, bonusScore, exerciseScore, week: selectedWeek,
          };
          const rowData: TableRowData = { id: index + 1, ...rowDataShape, total: computeTotal(rowDataShape) };
          return rowData;
        });
        setData(formattedData);
      })
      .catch(error => { console.error(`Error fetching data for week ${selectedWeek}:`, error); setData([]); });
  }, [computeTotal]);

  const getWeeklyData = useCallback((week: number) => {
    fetch(`https://admin.bitshala.org/attendance/weekly_counts/${week}`)
      .then(res => res.json())
      .then(apiData => {
        if (Array.isArray(apiData)) {
          const currentWeekData = apiData.find(wd => wd.week === week);
          setWeeklyData(currentWeekData || { week: week, attended: 0 });
        } else if (apiData && typeof apiData === 'object' && apiData.week !== undefined) {
          setWeeklyData(apiData);
        } else { setWeeklyData({ week: week, attended: 0 }); }
      })
      .catch(err => { console.error("Error fetching weekly attendance:", err); setWeeklyData({ week: week, attended: 0 }); });
  }, []);

  useEffect(() => { fetchWeeklyData(week); getWeeklyData(week); }, [fetchWeeklyData, getWeeklyData, week]);

  useEffect(() => {
    fetch("https://admin.bitshala.org/students/count")
      .then(res => res.json()).then(data => setTotalCount(data.count))
      .catch(err => console.error("Error fetching total count:", err));
  }, []);

  // --- DATA PROCESSING (SORTING/FILTERING) ---
  const taOptions = useMemo(() => {
    if (!data || data.length === 0) return ['All TAs'];
    const uniqueTAs = new Set(data.map(person => person.ta).filter(ta => ta && ta !== 'N/A'));
    return ['All TAs', ...Array.from(uniqueTAs).sort()];
  }, [data]);

  const processedData = useMemo(() => {
    let filteredData = [...data];
    if (selectedGroup !== 'All Groups') filteredData = filteredData.filter(p => p.group === selectedGroup);
    if (selectedTA !== 'All TAs') filteredData = filteredData.filter(p => p.ta === selectedTA);
    if (attendanceFilter === 'Present') filteredData = filteredData.filter(p => p.attendance === true);
    else if (attendanceFilter === 'Absent') filteredData = filteredData.filter(p => p.attendance === false);
    if (searchTerm) filteredData = filteredData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key!]; const bValue = b[sortConfig.key!];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === 'ascending' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
        }
        return 0;
      });
    }
    return filteredData;
  }, [data, searchTerm, sortConfig, selectedGroup, selectedTA, attendanceFilter]);

  // --- EVENT HANDLERS ---
  const requestSort = (key: keyof TableRowData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const handleClear = () => {
    setSearchTerm(''); setSelectedGroup('All Groups'); setSelectedTA('All TAs'); setAttendanceFilter('All');
  };

  const handleAttendanceChange = (id: number) => {
    setData(currentData => {
        let updatedRow: TableRowData | null = null;
        const newData = currentData.map(p => {
            if (p.id === id) {
                updatedRow = { ...p, attendance: !p.attendance };
                return updatedRow;
            }
            return p;
        });
        if (updatedRow) {
            setEditedRows(prev => [...prev.filter(r => r.id !== id), updatedRow!]);
        }
        return newData;
    });
    setIsEditing(true);

  };

  const handleGdScoreChange = (id: number, key: keyof TableRowData['gdScore'], v: string) => {
    setData(currentData => {
        let updatedRow: TableRowData | null = null;
        const newData = currentData.map(p => {
            if (p.id === id) {
                const newGdScore = { ...p.gdScore, [key]: parseInt(v) || 0 };
                updatedRow = { ...p, gdScore: newGdScore, total: computeTotal({ ...p, gdScore: newGdScore }) };
                return updatedRow;
            }
            return p;
        });
        if (updatedRow) {
            setEditedRows(prev => [...prev.filter(r => r.id !== id), updatedRow!]);
        }
        return newData;
    });
    setIsEditing(true);

  };

  const handleBonusScoreChange = (id: number, key: keyof TableRowData['bonusScore'], v: string) => {
      setData(currentData => {
          let updatedRow: TableRowData | null = null;
          const newData = currentData.map(p => {
              if (p.id === id) {
                  const newBonusScore = { ...p.bonusScore, [key]: parseInt(v) || 0 };
                  updatedRow = { ...p, bonusScore: newBonusScore, total: computeTotal({ ...p, bonusScore: newBonusScore }) };
                  return updatedRow;
              }
              return p;
          });
          if (updatedRow) {
              setEditedRows(prev => [...prev.filter(r => r.id !== id), updatedRow!]);
          }
          return newData;
      });
      setIsEditing(true);

  };

  const handleExerciseScoreChange = (id: number, key: keyof TableRowData['exerciseScore']) => {
      setData(currentData => {
          let updatedRow: TableRowData | null = null;
          const newData = currentData.map(p => {
              if (p.id === id) {
                  const newExerciseScore = { ...p.exerciseScore, [key]: !p.exerciseScore[key] };
                  updatedRow = { ...p, exerciseScore: newExerciseScore, total: computeTotal({ ...p, exerciseScore: newExerciseScore }) };
                  return updatedRow;
              }
              return p;
          });
          if (updatedRow) {
              setEditedRows(prev => [...prev.filter(r => r.id !== id), updatedRow!]);
          }
          return newData;
      });
      setIsEditing(true);
  
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    const payload = editedRows
      .map(p => ({
        name: p.name, mail: p.email, attendance: p.attendance ? 'yes' : 'no', week: p.week ?? week,
        group_id: p.group, ta: p.ta === 'N/A' ? undefined : p.ta, fa: p.gdScore.fa, fb: p.gdScore.fb,
        fc: p.gdScore.fc, fd: p.gdScore.fd, bonus_attempt: p.bonusScore.attempt,
        bonus_answer_quality: p.bonusScore.good, bonus_follow_up: p.bonusScore.followUp,
        exercise_submitted: p.exerciseScore.Submitted ? 'yes' : 'no',
        exercise_test_passing: p.exerciseScore.privateTest ? 'yes' : 'no',
        exercise_good_documentation: p.exerciseScore.goodDoc ? 'yes' : 'no',
        exercise_good_structure: p.exerciseScore.goodStructure ? 'yes' : 'no',
        total: computeTotal(p)
      }));
      console.log(payload,"payload");
    fetch(`https://admin.bitshala.org/weekly_data/${week}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      setIsEditing(false);
 
      
      setEditedRows([]); // Reset edited rows on successful save
      getWeeklyData(week);
      return r.json();
    })
    .catch(e => console.error('Save failed', e));
  };

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Group", "TA", "Attendance", "fa", "fb", "fc", "fd", "Bonus_Attempt", "Bonus_Good", "Bonus_FollowUp", "Submitted", "PrivateTest", "GoodStructure", "GoodDoc", "Total", "Week"];
    const rows = data.map(p => [
      p.name, p.email || '', p.group, p.ta || '', p.attendance ? 'yes' : 'no',
      p.gdScore.fa, p.gdScore.fb, p.gdScore.fc, p.gdScore.fd, p.bonusScore.attempt, p.bonusScore.good, p.bonusScore.followUp,
      p.exerciseScore.Submitted ? 'yes' : 'no', p.exerciseScore.privateTest ? 'yes' : 'no',
      p.exerciseScore.goodStructure ? 'yes' : 'no', p.exerciseScore.goodDoc ? 'yes' : 'no',
      computeTotal(p), p.week ?? week
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `cohort-week-${week}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddNewRowForm = () => {
    setNewStudent({ ...initialNewStudentFormStateProto, group: baseGroups[0] || 'Group 0' });
    setShowTableRowForm(true);
  };

  const handleNewStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewStudent(prev => {
      if (name.startsWith("gdScore.")) { const key = name.split(".")[1] as keyof TableRowData['gdScore']; return { ...prev, gdScore: { ...prev.gdScore, [key]: parseInt(value) || 0 } }; }
      if (name.startsWith("bonusScore.")) { const key = name.split(".")[1] as keyof TableRowData['bonusScore']; return { ...prev, bonusScore: { ...prev.bonusScore, [key]: parseInt(value) || 0 } }; }
      if (name.startsWith("exerciseScore.")) { const key = name.split(".")[1] as keyof TableRowData['exerciseScore']; return { ...prev, exerciseScore: { ...prev.exerciseScore, [key]: checked } }; }
      return { ...prev, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const handleConfirmAddStudent = () => {
    if (!newStudent.name.trim()) { alert("Student name is required."); return; }

    const payload = {
        name: newStudent.name, mail: newStudent.email, attendance: newStudent.attendance ? 'yes' : 'no', week: week ?? week,
        group_id: newStudent.group, ta: newStudent.ta === 'N/A' ? undefined : newStudent.ta, fa: newStudent.gdScore.fa, fb: newStudent.gdScore.fb,
        fc: newStudent.gdScore.fc, fd: newStudent.gdScore.fd, bonus_attempt: newStudent.bonusScore.attempt,
        bonus_answer_quality: newStudent.bonusScore.good, bonus_follow_up: newStudent.bonusScore.followUp,
        exercise_submitted: newStudent.exerciseScore.Submitted ? 'yes' : 'no',
        exercise_test_passing: newStudent.exerciseScore.privateTest ? 'yes' : 'no',
        exercise_good_documentation: newStudent.exerciseScore.goodDoc ? 'yes' : 'no',
        exercise_good_structure: newStudent.exerciseScore.goodStructure ? 'yes' : 'no',
        total: computeTotal(newStudent)
    }
    fetch(`https://admin.bitshala.org/weekly_data/${week}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    })
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      console.log("New student added successfully");
      fetchWeeklyData(week);
      setShowTableRowForm(false);
      setIsEditing(false);

      getWeeklyData(week);
      return r.text();
    })
    .catch(e => console.error('Save failed', e));
  };

  const handleDeleteRow = () => {
    if (contextMenu.targetId === null) return;
    const rowToDelete = data.find(p => p.id === contextMenu.targetId);
    if (!rowToDelete) {
      console.error("Could not find row to delete in frontend state.");
      setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
      return;
    }
    const payload = {
        name: rowToDelete.name, mail: rowToDelete.email, week: rowToDelete.week ?? week, group_id: rowToDelete.group,
        ta: rowToDelete.ta === 'N/A' ? undefined : rowToDelete.ta, attendance: rowToDelete.attendance ? 'yes' : 'no',
        fa: rowToDelete.gdScore.fa, fb: rowToDelete.gdScore.fb, fc: rowToDelete.gdScore.fc, fd: rowToDelete.gdScore.fd,
        bonus_attempt: rowToDelete.bonusScore.attempt, bonus_answer_quality: rowToDelete.bonusScore.good,
        bonus_follow_up: rowToDelete.bonusScore.followUp,
        exercise_submitted: rowToDelete.exerciseScore.Submitted ? 'yes' : 'no',
        exercise_test_passing: rowToDelete.exerciseScore.privateTest ? 'yes' : 'no',
        exercise_good_documentation: rowToDelete.exerciseScore.goodDoc ? 'yes' : 'no',
        exercise_good_structure: rowToDelete.exerciseScore.goodStructure ? 'yes' : 'no',
        total: computeTotal(rowToDelete)
    };
    fetch(`https://admin.bitshala.org/del/${week}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(response => {
      if (!response.ok) { return response.text().then(text => { throw new Error(text || response.statusText) }); }
      setData(prevData => prevData.filter(p => p.id !== contextMenu.targetId));
      getWeeklyData(week);
    })
    .catch(e => console.error('Delete failed:', e))
    .finally(() => setContextMenu({ visible: false, x: 0, y: 0, targetId: null }));
  };

  const handleNameRightClick = (event: React.MouseEvent<HTMLTableCellElement>, personId: number) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, targetId: personId });
  };

  useEffect(() => {
    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
      }
    };
    const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && contextMenu.visible) {
            setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
        }
    };
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutsideContextMenu);
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('click', handleClickOutsideContextMenu);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [contextMenu.visible]);

  const getSortIndicator = (key: keyof TableRowData) => (sortConfig.key === key ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : '');
  const scoreOptions = [0, 1, 2, 3, 4, 5];

    const fetchStudentRepoLink = async (week: number, student_name: string) => {
    try {
      const res = await fetch(`https://admin.bitshala.org/students/${week}/${student_name}`);
      
      const contentType = res.headers.get("Content-Type") || "";
      if (!res.ok) {
        const text = await res.text();
        console.error(`Server Error ${res.status}:`, text);
        return;
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }

      const data = await res.json();
      console.log("Repo Link:", data.url);
      if (data.url) {
        window.open(data.url, '_blank');
      }

    } catch (err) {
      console.error("fetchStudentRepoLink error:", err);
    }
};

  
  // --- RENDER ---
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-zinc-50 min-h-screen  bg-zinc-900 text-zinc-300/90">
      {showTableRowForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-op-50">
          <div className="bg-white border-zinc-300 text-zinc-800 rounded-lg shadow-xl flex flex-col w-full max-w-2xl max-h-90vh">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200">
              <h3 className="text-xl font-semibold">Add New Student (Week {week})</h3>
              <button className="cursor-pointer text-zinc-400 hover:text-zinc-600 text-2xl leading-none p-1" onClick={() => setShowTableRowForm(false)} aria-label="Close">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Form fields */}
              <div>
                <label htmlFor="form-name" className="block text-sm font-medium text-zinc-700">Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="form-name" value={newStudent.name} onChange={handleNewStudentChange} required className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="form-email" className="block text-sm font-medium text-zinc-700">Email</label>
                <input type="email" name="email" id="form-email" value={newStudent.email} onChange={handleNewStudentChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="form-group" className="block text-sm font-medium text-zinc-700">Group</label>
                <select name="group" id="form-group" value={newStudent.group} onChange={handleNewStudentChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                  {baseGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="form-ta" className="block text-sm font-medium text-zinc-700">TA</label>
                <input type="text" name="ta" id="form-ta" value={newStudent.ta} onChange={handleNewStudentChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="attendance" id="form-attendance" checked={newStudent.attendance} onChange={handleNewStudentChange} className="h-4 w-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500"/>
                <label htmlFor="form-attendance" className="ml-2 block text-sm text-zinc-900">Attended This Week</label>
              </div>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium text-zinc-700 px-1">GD Scores</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  {(['fa', 'fb', 'fc', 'fd'] as const).map(key => (<div key={key}><label htmlFor={`form-gdScore.${key}`} className="block text-xs font-medium text-zinc-600 capitalize">{key.replace('f','Factor ')}</label><select name={`gdScore.${key}`} id={`form-gdScore.${key}`} value={newStudent.gdScore[key]} onChange={handleNewStudentChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">{scoreOptions.map(val => <option key={val} value={val}>{val === 0 ? '-' : val}</option>)}</select></div>))}
                </div>
              </fieldset>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium text-zinc-700 px-1">Bonus Scores</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  {(['attempt', 'good', 'followUp'] as const).map(key => (<div key={key}><label htmlFor={`form-bonusScore.${key}`} className="block text-xs font-medium text-zinc-600 capitalize">{key}</label><select name={`bonusScore.${key}`} id={`form-bonusScore.${key}`} value={newStudent.bonusScore[key]} onChange={handleNewStudentChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">{scoreOptions.map(val => <option key={val} value={val}>{val === 0 ? '-' : val}</option>)}</select></div>))}
                </div>
              </fieldset>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-sm font-medium text-zinc-700 px-1">Exercise Scores</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-2">
                  {(Object.keys(newStudent.exerciseScore) as Array<keyof TableRowData['exerciseScore']>).map(key => (<div key={key} className="flex items-center"><input type="checkbox" name={`exerciseScore.${key}`} id={`form-exerciseScore.${key}`} checked={newStudent.exerciseScore[key]} onChange={handleNewStudentChange} className="h-4 w-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500"/><label htmlFor={`form-exerciseScore.${key}`} className="ml-2 block text-sm text-zinc-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label></div>))}
                </div>
              </fieldset>
            </div>
            <div className="flex justify-end items-center p-4 border-t border-zinc-200 space-x-3">
              <button type="button" onClick={() => setShowTableRowForm(false)} className="cursor-pointer px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">Cancel</button>
              <button type="button" onClick={handleConfirmAddStudent} className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div ref={contextMenuRef} style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-1000 bg-white border border-zinc-300 rounded-md shadow-lg py-1 w-40">
          <ul>
            <li><button onClick={handleDeleteRow} className="cursor-pointer w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-red-500 hover:text-white">Delete Row</button></li>
          </ul>
        </div>
      )}

      <div className="max-w-full mx-auto ">
        <h1>Learning Bitcoin From Command Line</h1>
        <h2 className='font-light'>30th May - 27th july</h2>
        <h2 className='font-light'>Github Classroom Master Repository</h2>
        <h3 className="">Cohort Participants</h3>

        <div className='flex gap-4 mb-4 items-center'>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <button key={i} onClick={() => { setWeek(i);  setIsEditing(false); setContextMenu({visible: false, x: 0, y: 0, targetId: null}); setEditedRows([]); }}
              className="cursor-pointer b-0 bg-orange-400 hover:bg-orange-500 text-white font-light text-xl px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200">
              Week {i}
            </button>
          ))}
           <button onClick={() => { navigate('/result');}}
              className="cursor-pointer b-0 bg-orange-400 hover:bg-orange-500 text-white font-light text-xl px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200">
              Result
            </button>
        </div>
        
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="b-0 px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 flex-grow sm:flex-grow-0 sm:w-auto"/>
          <select id="groupFilter" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500">
            {['All Groups', ...baseGroups].map(groupName => <option key={groupName} value={groupName}>{groupName}</option>)}
          </select>
          <select id="taFilter" value={selectedTA} onChange={(e) => setSelectedTA(e.target.value)} className="b-0  px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500">
            {taOptions.map(taName => <option key={taName} value={taName}>{taName}</option>)}
          </select>
          <select id="attendanceFilter" value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value as 'All' | 'Present' | 'Absent')} className="b-0  px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500">
            <option value="All">All Attendance</option><option value="Present">Present</option><option value="Absent">Absent</option>
          </select>
          <button onClick={handleClear} className="cursor-pointer b-0  px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 border border-zinc-300 rounded-md">Clear Filters</button>
        </div>

        <div className="flex justify-between items-center gap-2 mb-4 mt-8">
          <div className='flex gap-8 text-2xl '>
            <div>Total Participants: {totalCount ?? '...'}</div>
            <div>Attendes: {weeklyData.attended ?? 0}</div>
            <div>Absentes: {(totalCount && weeklyData.attended !== undefined) ? (totalCount - weeklyData.attended) : '...'}</div>
          </div>
          <div className='flex gap-2'>
            <button onClick={openAddNewRowForm} className="cursor-pointer b-0 px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded ">Add New Row</button>
            <button onClick={handleEdit} disabled={isEditing} className="cursor-pointer b-0 px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded  ">Edit</button>
            <button onClick={handleSave} disabled={!isEditing} className="cursor-pointer b-0 px-4 py-2  text-white rounded bg-green-600 hover:bg-green-500 disabled:bg-green-200 ">Save</button>
            <button onClick={downloadCSV}  className="cursor-pointer b-0 px-4 py-2 bg-red-600 text-white rounded ">Download CSV</button>
          </div>
        </div>

        <div className="shadow-lg overflow-hidden bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-900">
              <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className=" px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase hover:bg-orange-50 tracking-wider align-middle cursor-pointer bg-orange-200 transition-colors duration-200 border-b border-zinc-200" 
                    onClick={() => requestSort('name')}
                  >
                    Name{getSortIndicator('name')}
                  </th>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase hover:bg-orange-50 tracking-wider align-middle bg-orange-200 hidden sm:table-cell border-b border-zinc-200"
                  >
                    Email
                  </th>
                  {week > 0 && (
                    <th 
                      scope="col" 
                      rowSpan={2} 
                      className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 hover:bg-orange-50 bg-orange-200 uppercase tracking-wider hidden sm:table-cell align-middle cursor-pointer hover:bg-orange-50 transition-colors duration-200 border-b border-zinc-200" 
                      onClick={() => requestSort('group')}
                    >
                      Group{getSortIndicator('group')}
                    </th>
                  )}
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-3 text-left text-xs font-semibold text-zinc-700  hover:bg-orange-50 bg-orange-200 uppercase tracking-wider hidden md:table-cell align-middle border-b border-zinc-200"
                  >
                    TA
                  </th>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-3 text-left text-xs font-semibold text-zinc-700  hover:bg-orange-50  bg-orange-200 uppercase tracking-wider hidden lg:table-cell align-middle border-b border-zinc-200"
                  >
                    Attendance
                  </th>
                  <th 
                    scope="col" 
                    colSpan={4} 
                    className="px-6 py-3 text-center text-xs font-semibold hover:bg-orange-50 uppercase tracking-wider bg-orange-200 text-zinc-700 border-b border-zinc-200"
                  >
                    GD SCORE
                  </th>
                  <th 
                    scope="col" 
                    colSpan={3} 
                    className="px-6 py-3 text-center text-xs font-semibold  hover:bg-orange-50 uppercase tracking-wider bg-orange-200 text-zinc-700 border-b border-zinc-200"
                  >
                    BONUS SCORE
                  </th>
                  <th 
                    scope="col" 
                    colSpan={4} 
                    className="px-6 py-3 text-center text-xs font-semibold hover:bg-orange-50 text-orange-700 uppercase tracking-wider bg-orange-200 text-zinc-700 border-b border-zinc-200"
                  >
                    EXERCISE SCORES
                  </th>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-3 text-center text-xs font-semibold text-zinc-700 uppercase tracking-wider align-middle cursor-pointer hover:bg-orange-50 bg-orange-200 text-zinc-700 transition-colors duration-200 border-b border-zinc-200" 
                    onClick={() => requestSort('total')}
                  >
                    Total{getSortIndicator('total')}
                  </th>
                </tr>
                <tr className="bg-zinc-50">
                  <th scope="col" className=" px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Communication
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Depth Of Answer
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Technical Bitcoin Fluency
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Engagement
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Attempt
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Good
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Follow Up
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Submitted
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Github Test
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Good Structure
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-zinc-600 uppercase tracking-wider bg-orange-100 border-b border-zinc-200">
                    Good doc
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-zinc-200">
                {processedData.map((person) => (
                  <tr key={person.id} className="cursor-pointer hover:bg-zinc-50 transition-colors duration-150">
                    <td className="cursor-pointer px-6 py-4 whitespace-nowrap cursor-default" onClick={() => handleStudentClick(person.name)} onContextMenu={(e) => handleNameRightClick(e, person.id)}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
                            {person.name.charAt(0)}{(person.name.split(' ')[1]?.charAt(0) || '').toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4"><div className="text-sm font-medium text-zinc-900">{person.name}</div></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell"><div className="text-sm text-zinc-900">{person.email || '-'}</div></td>
                    {week > 0 && <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell"><div className="text-sm text-zinc-900">{person.group}</div></td>}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm text-zinc-500">{person.ta || '-'}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 hidden lg:table-cell">
                        <input type="checkbox" checked={person.attendance} disabled={!isEditing} onChange={() => handleAttendanceChange(person.id)} className="h-4 w-4 text-orange-600 border-zinc-300 rounded focus:ring-orange-500 disabled:cursor-not-allowed"/>
                    </td>
                    {(['fa', 'fb', 'fc', 'fd'] as const).map(key => (<td key={key} className=" px-3 py-4 whitespace-nowrap text-center text-sm"><select value={person.gdScore[key]} disabled={!canEditFields} onChange={e => handleGdScoreChange(person.id, key, e.target.value)} className="b-1 bg-orange-200 rounded-md shadow-sm p-1 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-100">{scoreOptions.map(val => (<option key={val} value={val}>{val === 0 ? '-' : val}</option>))}</select></td>))}
                    {(['attempt', 'good', 'followUp'] as const).map(key => (<td key={key} className="b-0 px-3 py-4 whitespace-nowrap text-center text-sm"><select value={person.bonusScore[key]} disabled={!canEditFields} onChange={e => handleBonusScoreChange(person.id, key, e.target.value)} className="b-1 bg-orange-200  rounded-md shadow-sm p-1 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-100">{scoreOptions.map(val => (<option key={val} value={val}>{val === 0 ? '-' : val}</option>))}</select></td>))}
                    {(['Submitted', 'privateTest', 'goodStructure', 'goodDoc'] as const).map(key => (
                      <td key={key} className="b-0 px-3 py-4 whitespace-nowrap text-center text-sm">
                          <div className='flex gap-2'>
                            <input type="checkbox" checked={person.exerciseScore[key]}  
                            onChange={() => handleExerciseScoreChange(person.id, key)} 
                            className="b-0 h-4 w-4 text-orange-600  rounded focus:ring-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-100"/>
                            {key === 'Submitted' && person.exerciseScore[key] === true? 
                              <svg onClick={() => fetchStudentRepoLink(week, person.name)} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 50 50">
                              <path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609824 4 46 13.390176 46 25 C 46 36.609824 36.609824 46 25 46 C 13.390176 46 4 36.609824 4 25 C 4 13.390176 13.390176 4 25 4 z M 25 11 A 3 3 0 0 0 22 14 A 3 3 0 0 0 25 17 A 3 3 0 0 0 28 14 A 3 3 0 0 0 25 11 z M 21 21 L 21 23 L 22 23 L 23 23 L 23 36 L 22 36 L 21 36 L 21 38 L 22 38 L 23 38 L 27 38 L 28 38 L 29 38 L 29 36 L 28 36 L 27 36 L 27 21 L 26 21 L 22 21 L 21 21 z"></path>
                              </svg>   : null}
                          </div>
                      </td>))}
                    <td className="px-6 py-4 text-center text-sm font-medium text-zinc-700">{isEditing ? computeTotal(person) : person.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {processedData.length === 0 && (<div className="text-center py-10 text-zinc-500">No data available {searchTerm || selectedGroup !== 'All Groups' || selectedTA !== 'All TAs' || attendanceFilter !== 'All' ? 'for your current filters' : ''}.</div>)}
           {processedData.length > 0 && (<div className="px-4 py-3 flex items-center justify-between border-t border-zinc-200 sm:px-6"><div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-zinc-700">Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, processedData.length)}</span> of{' '}<span className="font-medium">{processedData.length}</span> results</p></div></div></div>)}
        </div>
      </div>
    </div>
  );
};

export default TableView;
