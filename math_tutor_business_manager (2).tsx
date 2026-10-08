import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, DollarSign, Receipt, FileText, Settings, Plus, Edit, Trash2, 
  Save, Download, Upload, CheckCircle, Clock, Search, Eye, Filter,
  TrendingUp, TrendingDown, BookOpen, AlertCircle, ChevronLeft,
  Phone, UserCheck, ShieldAlert, Sparkles, Building2, User, FileSpreadsheet, HardDrive, Database, RefreshCw
} from 'lucide-react';

// IndexedDB Helper Functions for robust persistent browser storage
const DB_NAME = 'MathTutorBusinessDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.error('IndexedDB open error:', e);
      resolve(null);
    };
  });
};

const saveToIndexedDB = async (key, value) => {
  try {
    const db = await initDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Save to IndexedDB failed:', err);
    return false;
  }
};

const loadFromIndexedDB = async (key) => {
  try {
    const db = await initDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Load from IndexedDB failed:', err);
    return null;
  }
};

const DEFAULT_BUSINESS_INFO = {
  ownerName: "אירית רביב אגי",
  businessTitle: "הוראת מתמטיקה ושיעורים פרטיים",
  taxType: "exempt", // "exempt" (עוסק פטור) or "registered" (עוסק מורשה)
  taxId: "012345678",
  phone: "050-1234567",
  email: "irit@math-tutor.co.il",
  defaultRate: 180
};

const EXPENSE_CATEGORIES = [
  { id: 'cat_materials', label: 'ציוד לימודי וספרות מקצועית', defaultPercent: 100 },
  { id: 'cat_travel', label: 'נסיעות / דלק לשיעורים', defaultPercent: 45 },
  { id: 'cat_home_office', label: 'אחזקת חדר עבודה / הוצאות בית (ארנונה, חשמל, אינטרנט)', defaultPercent: 25 },
  { id: 'cat_marketing', label: 'שיווק, פרסום ותוכנות (Zoom, אתר)', defaultPercent: 100 },
  { id: 'cat_courses', label: 'השתלמויות וקורסים', defaultPercent: 100 },
  { id: 'cat_office', label: 'ציוד משרדי ומחשוב', defaultPercent: 100 },
  { id: 'cat_other', label: 'הוצאות אחרות', defaultPercent: 100 }
];

const INITIAL_STUDENTS = [
  { id: 'st_1', name: 'עומר לוי', grade: 'כיתה י_4 (4 יחידות)', rate: 180, phone: '054-1112233', notes: 'מתכונן לשאלון 481, מעדיף שיעורים בימי שני' },
  { id: 'st_2', name: 'מאיה כהן', grade: 'כיתה יא_2 (5 יחידות)', rate: 200, phone: '052-9998877', notes: '5 יחידות, חיזוק בטריגונומטריה במרחב' },
  { id: 'st_3', name: 'דניאל אברהם', grade: 'כיתה ט_1', rate: 160, phone: '050-5554433', notes: 'מכינה לתיכון, משוואות ריבועיות' }
];

const INITIAL_LESSONS = [
  { id: 'les_1', studentId: 'st_1', studentName: 'עומר לוי', date: '2026-10-01', amount: 180, duration: 60, payMethod: 'Bit', status: 'paid', invoiceNo: 'INV-1001', notes: 'חשבון דיפרנציאלי ואינטגרלי' },
  { id: 'les_2', studentId: 'st_2', studentName: 'מאיה כהן', date: '2026-10-02', amount: 200, duration: 60, payMethod: 'העברה בנקאית', status: 'paid', invoiceNo: 'INV-1002', notes: 'טריגונומטריה במרחב' },
  { id: 'les_3', studentId: 'st_3', studentName: 'דניאל אברהם', date: '2026-10-05', amount: 160, duration: 60, payMethod: 'מזומן', status: 'unpaid', invoiceNo: '', notes: 'משוואות ריבועיות ופירוק לגורמים' },
  { id: 'les_4', studentId: 'st_1', studentName: 'עומר לוי', date: '2026-10-06', amount: 180, duration: 60, payMethod: 'Bit', status: 'paid', invoiceNo: 'INV-1003', notes: 'תרגול לקראת מבחן מתכונת' }
];

const INITIAL_EXPENSES = [
  { id: 'exp_1', supplier: 'סטימצקי', receiptNo: 'REC-8842', date: '2026-09-15', description: 'ספרי לימוד ומיקוד במתמטיקה - 5 יחידות', category: 'ציוד לימודי וספרות מקצועית', totalAmount: 350, taxPercent: 100, receiptUrl: '', notes: 'ספרים לשנת הלימודים תשפ"ז' },
  { id: 'exp_2', supplier: 'KSP מחשבים', receiptNo: 'REC-1102', date: '2026-09-20', description: 'מחשבון מדעי מתקדם Casio FX-991ES', category: 'ציוד משרדי ומחשוב', totalAmount: 220, taxPercent: 100, receiptUrl: '', notes: 'עבור הדגמות בשיעורים' },
  { id: 'exp_3', supplier: 'בזק / סלקום', receiptNo: 'REC-9941', date: '2026-10-01', description: 'חשבון אינטרנט ביתי (חלק יחסי חדר עבודה)', category: 'אחזקת חדר עבודה / הוצאות בית (ארנונה, חשמל, אינטרנט)', totalAmount: 160, taxPercent: 25, receiptUrl: '', notes: 'שיעורים מקוונים ב-Zoom' },
  { id: 'exp_4', supplier: 'דלק פז', receiptNo: 'REC-4431', date: '2026-10-03', description: 'דלק לנסיעות לשיעורים פרטיים בבית התלמידים', category: 'נסיעות / דלק לשיעורים', totalAmount: 300, taxPercent: 45, receiptUrl: '', notes: 'נסיעות חודש אוקטובר' }
];

export default function App() {
  const [businessInfo, setBusinessInfo] = useState(DEFAULT_BUSINESS_INFO);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);

  // Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [lessonFilterStatus, setLessonFilterStatus] = useState('all');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('all');
  const [reportYear, setReportYear] = useState('2026');

  useEffect(() => {
    const loadAllPersistedData = async () => {
      try {
        // First try IndexedDB (most reliable in mobile Chrome)
        const idbData = await loadFromIndexedDB('full_app_state');
        if (idbData) {
          if (idbData.businessInfo) setBusinessInfo(idbData.businessInfo);
          if (idbData.students) setStudents(idbData.students);
          if (idbData.lessons) setLessons(idbData.lessons);
          if (idbData.expenses) setExpenses(idbData.expenses);
        } else {
          // Fallback to LocalStorage if IndexedDB is empty
          const savedInfo = localStorage.getItem('math_tutor_businessInfo');
          const savedStudents = localStorage.getItem('math_tutor_students');
          const savedLessons = localStorage.getItem('math_tutor_lessons');
          const savedExpenses = localStorage.getItem('math_tutor_expenses');

          if (savedInfo) setBusinessInfo(JSON.parse(savedInfo));
          if (savedStudents) setStudents(JSON.parse(savedStudents));
          if (savedLessons) setLessons(JSON.parse(savedLessons));
          if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        }
      } catch (err) {
        console.error('Error loading stored state:', err);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadAllPersistedData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return; // Prevent overwriting with initial state during boot

    const saveStateToBothStores = async () => {
      const fullState = { businessInfo, students, lessons, expenses };
      
      // 1. Synchronous LocalStorage Save
      try {
        localStorage.setItem('math_tutor_businessInfo', JSON.stringify(businessInfo));
        localStorage.setItem('math_tutor_students', JSON.stringify(students));
        localStorage.setItem('math_tutor_lessons', JSON.stringify(lessons));
        localStorage.setItem('math_tutor_expenses', JSON.stringify(expenses));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }

      // 2. Asynchronous IndexedDB Save (Survives mobile Chrome tab closures)
      await saveToIndexedDB('full_app_state', fullState);

      const now = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
    };

    saveStateToBothStores();
  }, [businessInfo, students, lessons, expenses, isDataLoaded]);

  const triggerManualSaveNotice = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const totalIncomePaid = useMemo(() => {
    return lessons.filter(l => l.status === 'paid').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  }, [lessons]);

  const totalUnpaidIncome = useMemo(() => {
    return lessons.filter(l => l.status === 'unpaid').reduce((sum, l) => sum + Number(l.amount || 0), 0);
  }, [lessons]);

  const totalGrossExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
  }, [expenses]);

  const totalRecognizedExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.totalAmount || 0) * (Number(e.taxPercent || 100) / 100)), 0);
  }, [expenses]);

  const netProfit = totalIncomePaid - totalGrossExpenses;
  const taxableProfit = Math.max(0, totalIncomePaid - totalRecognizedExpenses);

  const handleSaveStudent = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newStudentData = {
      id: editingStudent ? editingStudent.id : `st_${Date.now()}`,
      name: formData.get('name'),
      grade: formData.get('grade'),
      rate: Number(formData.get('rate')),
      phone: formData.get('phone'),
      notes: formData.get('notes')
    };

    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? newStudentData : s));
      setLessons(lessons.map(l => l.studentId === editingStudent.id ? { ...l, studentName: newStudentData.name } : l));
    } else {
      setStudents([...students, newStudentData]);
    }

    setIsStudentModalOpen(false);
    setEditingStudent(null);
    triggerManualSaveNotice();
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('האם למחוק תלמיד/ה זה? השיעורים של התלמיד יישארו ביומן.')) {
      setStudents(students.filter(s => s.id !== id));
      triggerManualSaveNotice();
    }
  };

  const handleSaveLesson = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const stId = formData.get('studentId');
    const selectedSt = students.find(s => s.id === stId);

    const newLesson = {
      id: editingLesson ? editingLesson.id : `les_${Date.now()}`,
      studentId: stId,
      studentName: selectedSt ? selectedSt.name : (formData.get('customStudentName') || 'תלמיד'),
      date: formData.get('date'),
      amount: Number(formData.get('amount')),
      duration: Number(formData.get('duration')),
      payMethod: formData.get('payMethod'),
      status: formData.get('status'),
      invoiceNo: formData.get('invoiceNo'),
      notes: formData.get('notes')
    };

    if (editingLesson) {
      setLessons(lessons.map(l => l.id === editingLesson.id ? newLesson : l));
    } else {
      setLessons([newLesson, ...lessons]);
    }

    setIsLessonModalOpen(false);
    setEditingLesson(null);
    triggerManualSaveNotice();
  };

  const handleDeleteLesson = (id) => {
    if (window.confirm('האם למחוק שיעור זה?')) {
      setLessons(lessons.filter(l => l.id !== id));
      triggerManualSaveNotice();
    }
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fileInput = e.target.receiptFile;
    let receiptUrl = editingExpense ? editingExpense.receiptUrl : '';

    const processAndSave = (url) => {
      const selectedCatLabel = formData.get('category');
      const categoryObj = EXPENSE_CATEGORIES.find(c => c.label === selectedCatLabel);
      const taxPercent = formData.get('taxPercent') !== null && formData.get('taxPercent') !== "" 
        ? Number(formData.get('taxPercent')) 
        : (categoryObj ? categoryObj.defaultPercent : 100);

      const newExpense = {
        id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
        supplier: formData.get('supplier'),
        receiptNo: formData.get('receiptNo'),
        date: formData.get('date'),
        description: formData.get('description'),
        category: selectedCatLabel,
        totalAmount: Number(formData.get('totalAmount')),
        taxPercent: taxPercent,
        receiptUrl: url,
        notes: formData.get('notes')
      };

      if (editingExpense) {
        setExpenses(expenses.map(ex => ex.id === editingExpense.id ? newExpense : ex));
      } else {
        setExpenses([newExpense, ...expenses]);
      }

      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      triggerManualSaveNotice();
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processAndSave(reader.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      processAndSave(receiptUrl);
    }
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('האם למחוק הוצאה זו?')) {
      setExpenses(expenses.filter(e => e.id !== id));
      triggerManualSaveNotice();
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      businessInfo,
      students,
      lessons,
      expenses,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `גיבוי_עסק_מתמטיקה_${businessInfo.ownerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.businessInfo) setBusinessInfo(imported.businessInfo);
        if (imported.students) setStudents(imported.students);
        if (imported.lessons) setLessons(imported.lessons);
        if (imported.expenses) setExpenses(imported.expenses);
        alert('הנתונים שוחזרו בהצלחה למכשיר!');
        triggerManualSaveNotice();
      } catch (err) {
        alert('שגיאה בקריאת הקובץ. אנא ודא/י שזהו קובץ גיבוי JSON תקין.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('אזהרה: פעולה זו תאפס את כל הנתונים באפליקציה! האם להמשיך?')) {
      setBusinessInfo(DEFAULT_BUSINESS_INFO);
      setStudents(INITIAL_STUDENTS);
      setLessons(INITIAL_LESSONS);
      setExpenses(INITIAL_EXPENSES);
      localStorage.clear();
      triggerManualSaveNotice();
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Includes UTF-8 BOM for Excel Hebrew support
    csvContent += "תאריך,סוג תנועה,תיאור / תלמיד / ספק,סכום ברוטו,סכום מוכר במס,אמצעי תשלום / מס קבלה,סטטוס / קטגוריה,הערות\n";

    lessons.forEach(l => {
      csvContent += `"${l.date}","הכנסה","${l.studentName}","${l.amount}","${l.status === 'paid' ? l.amount : 0}","${l.payMethod || ''}","${l.status === 'paid' ? 'שולם' : 'טרם שולם'}","${l.notes || ''}"\n`;
    });

    expenses.forEach(e => {
      const recognized = Math.round(e.totalAmount * (e.taxPercent / 100));
      csvContent += `"${e.date}","הוצאה","${e.supplier || ''} - ${e.description}","-${e.totalAmount}","-${recognized}","${e.receiptNo || ''}","${e.category} (${e.taxPercent}% מוכר)","${e.notes || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `דוח_שנתי_מס_${reportYear}_${businessInfo.ownerName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.includes(studentSearch) || 
      (s.grade && s.grade.includes(studentSearch)) ||
      (s.phone && s.phone.includes(studentSearch))
    );
  }, [students, studentSearch]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (lessonFilterStatus === 'paid') return l.status === 'paid';
      if (lessonFilterStatus === 'unpaid') return l.status === 'unpaid';
      return true;
    });
  }, [lessons, lessonFilterStatus]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (expenseFilterCategory !== 'all') return e.category === expenseFilterCategory;
      return true;
    });
  }, [expenses, expenseFilterCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dir-rtl font-sans pb-16" dir="rtl">
      
      {/* Top Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            
            {/* Business Owner Information */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner shrink-0">
                <User className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold tracking-tight text-white">{businessInfo.ownerName}</h1>
                  <span className="text-xs bg-indigo-500/40 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-medium">
                    {businessInfo.taxType === 'exempt' ? 'עוסק פטור' : 'עוסק מורשה'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 font-medium">{businessInfo.businessTitle} • ח.פ/ת.ז: {businessInfo.taxId}</p>
              </div>
            </div>

            {/* Persistent IndexedDB + LocalStorage Sync Badge */}
            <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-200 w-full sm:w-auto justify-between sm:justify-end shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-300">✓ נשמר במכשיר (IndexedDB)</span>
                {lastSavedTime && <span className="text-slate-400 text-[11px]">({lastSavedTime})</span>}
              </div>
              <button 
                onClick={() => { triggerManualSaveNotice(); }}
                className="hover:text-white flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg transition font-medium shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                שמור כעת
              </button>
            </div>

          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 space-x-reverse border-t border-slate-700/60 overflow-x-auto py-2 scrollbar-none">
            {[
              { id: 'dashboard', label: 'דאשבורד סקירה', icon: Sparkles },
              { id: 'students', label: 'ניהול תלמידים', icon: Users },
              { id: 'lessons', label: 'יומן שיעורים והכנסות', icon: Calendar },
              { id: 'expenses', label: 'הוצאות וקבלות', icon: Receipt },
              { id: 'taxReport', label: 'דו"ח שנתי למס', icon: FileText },
              { id: 'settings', label: 'הגדרות עסק וגיבוי', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Save Notification Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-bounce">
          <Database className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">הנתונים נשמרו בבטחה ב-IndexedDB ואינם יימחקו בסגירת הדפדפן!</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">סך הכנסות (שולם)</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₪{totalIncomePaid.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">מתוך {lessons.filter(l => l.status === 'paid').length} שיעורים ששולמו</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">חובות פתוחים (לתשלום)</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">₪{totalUnpaidIncome.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 font-semibold mt-1">{lessons.filter(l => l.status === 'unpaid').length} שיעורים טרם שולמו</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">הוצאות מוכרות במס</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">₪{Math.round(totalRecognizedExpenses).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">מתוך ₪{totalGrossExpenses.toLocaleString()} בברוטו</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">רווח חייב במס משוער</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">₪{taxableProfit.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">רווח נקי בברוטו: ₪{netProfit.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Unpaid Alert Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  פעולות מהירות
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => { setEditingLesson(null); setIsLessonModalOpen(true); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
                  >
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4"/> תיעוד שיעור / הכנסה חדשה</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                  >
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4"/> הוספת תלמיד/ה חדש/ה</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition"
                  >
                    <span className="flex items-center gap-2"><Plus className="w-4 h-4"/> תיוק הוצאה / קבלה</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pending Unpaid Lessons Alert */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    תשלומים הממתינים לגבייה ({lessons.filter(l => l.status === 'unpaid').length})
                  </span>
                </h3>

                {lessons.filter(l => l.status === 'unpaid').length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                    <p className="font-semibold text-slate-600">כל השיעורים שולמו במלואם!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {lessons.filter(l => l.status === 'unpaid').map(lesson => (
                      <div key={lesson.id} className="py-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{lesson.studentName}</p>
                          <p className="text-xs text-slate-500">{lesson.date} • {lesson.notes || 'ללא הערות נושא'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900">₪{lesson.amount}</span>
                          <button 
                            onClick={() => {
                              setLessons(lessons.map(l => l.id === lesson.id ? { ...l, status: 'paid' } : l));
                              triggerManualSaveNotice();
                            }}
                            className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition font-medium"
                          >
                            סמן כסומן/שולם
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="חפש לפי שם תלמיד, כיתה, טלפון..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                הוסף תלמיד חדש
              </button>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map(student => {
                const studentLessons = lessons.filter(l => l.studentId === student.id);
                const totalUnpaid = studentLessons.filter(l => l.status === 'unpaid').reduce((s, l) => s + l.amount, 0);

                return (
                  <div key={student.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                          <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md mt-1 font-medium">
                            {student.grade || 'לא מצוין'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingStudent(student); setIsStudentModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                            title="ערוך תלמיד"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="מחק תלמיד"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <p className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          מחיר לשיעור: <span className="font-bold text-slate-800">₪{student.rate}</span>
                        </p>
                        {student.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-indigo-600" />
                            {student.phone}
                          </p>
                        )}
                        {student.notes && (
                          <p className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-500 mt-2">
                            {student.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block">שיעורים במערכת: {studentLessons.length}</span>
                        {totalUnpaid > 0 && (
                          <span className="text-amber-600 font-bold">חוב פתוח: ₪{totalUnpaid}</span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedStudentHistory(student)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        היסטוריה
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">סינון לפי סטטוס תשלום:</span>
                <select
                  value={lessonFilterStatus}
                  onChange={e => setLessonFilterStatus(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">כל השיעורים</option>
                  <option value="paid">שולם בלבד</option>
                  <option value="unpaid">טרם שולם (חובות)</option>
                </select>
              </div>

              <button
                onClick={() => { setEditingLesson(null); setIsLessonModalOpen(true); }}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                תיעוד שיעור חדש
              </button>
            </div>

            {/* Lessons Journal Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">תאריך</th>
                    <th className="p-4">שם התלמיד</th>
                    <th className="p-4">משך</th>
                    <th className="p-4">סכום</th>
                    <th className="p-4">אמצעי תשלום</th>
                    <th className="p-4">מס' חשבונית/קבלה</th>
                    <th className="p-4">סטטוס תשלום</th>
                    <th className="p-4">הערות נושא</th>
                    <th className="p-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLessons.map(lesson => (
                    <tr key={lesson.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-semibold text-slate-900 whitespace-nowrap">{lesson.date}</td>
                      <td className="p-4 font-bold text-indigo-950 whitespace-nowrap">{lesson.studentName}</td>
                      <td className="p-4 text-slate-600">{lesson.duration || 60} דק'</td>
                      <td className="p-4 font-extrabold text-slate-900 whitespace-nowrap">₪{lesson.amount}</td>
                      <td className="p-4 text-slate-600">{lesson.payMethod || 'Bit'}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{lesson.invoiceNo || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          lesson.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lesson.status === 'paid' ? 'שולם' : 'טרם שולם'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{lesson.notes || '-'}</td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => { setEditingLesson(lesson); setIsLessonModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                          title="ערוך שיעור"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition mr-1"
                          title="מחק שיעור"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">סינון לפי קטגוריה:</span>
                <select
                  value={expenseFilterCategory}
                  onChange={e => setExpenseFilterCategory(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">כל הקטגוריות</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.label}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                תייק הוצאה/קבלה חדשה
              </button>
            </div>

            {/* Expenses Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExpenses.map(expense => {
                const recognizedValue = Math.round(expense.totalAmount * (expense.taxPercent / 100));

                return (
                  <div key={expense.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                          {expense.category}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingExpense(expense); setIsExpenseModalOpen(true); }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base mb-1">{expense.description}</h4>
                      <p className="text-xs text-slate-400 mb-3">{expense.date} • ספק: {expense.supplier || 'ללא'} • מס' קבלה: {expense.receiptNo || 'אין'}</p>

                      <div className="space-y-1.5 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">סכום כולל בברוטו:</span>
                          <span className="font-bold text-slate-900">₪{expense.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">מוכר למס ({expense.taxPercent}%):</span>
                          <span className="font-bold text-emerald-600">₪{recognizedValue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-400 truncate max-w-[150px]">{expense.notes || 'אין הערות'}</span>
                      {expense.receiptUrl ? (
                        <button
                          onClick={() => setViewingReceipt(expense.receiptUrl)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          צפה בקבלה
                        </button>
                      ) : (
                        <span className="text-slate-300 font-medium">ללא צילום קבלה</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {activeTab === 'taxReport' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">דו"ח מס שנתי מרוכז - {businessInfo.ownerName}</h3>
                <p className="text-xs text-slate-500 mt-1">סיכום הכנסות, הוצאות מוכרות וחישוב רווח חייב במס עבור שנת המס</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={reportYear}
                  onChange={e => setReportYear(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="2026">שנת מס 2026</option>
                  <option value="2025">שנת מס 2025</option>
                  <option value="2024">שנת מס 2024</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  ייצוא ל-Excel / CSV
                </button>
              </div>
            </div>

            {/* Business Header Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">פרטי העסק והנישום</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">שם מלא:</span>
                    <span className="font-extrabold text-slate-900">{businessInfo.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">מספר עוסק / ת.ז:</span>
                    <span className="font-extrabold text-slate-900">{businessInfo.taxId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">סוג עוסק:</span>
                    <span className="font-extrabold text-slate-900">{businessInfo.taxType === 'exempt' ? 'עוסק פטור' : 'עוסק מורשה'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">עיסוק:</span>
                    <span className="font-extrabold text-slate-900">{businessInfo.businessTitle}</span>
                  </div>
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-3">
                <div className="flex justify-between p-3.5 bg-emerald-50/80 rounded-xl font-semibold text-emerald-950">
                  <span>1. סך הכנסות ברוטו (שיעורים ששולמו בפועל)</span>
                  <span className="font-extrabold text-lg">₪{totalIncomePaid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between p-3.5 bg-rose-50/80 rounded-xl font-semibold text-rose-950">
                  <span>2. סך הוצאות מוכרות במס (לפי אחוזי מוכר בחוק)</span>
                  <span className="font-extrabold text-lg">- ₪{Math.round(totalRecognizedExpenses).toLocaleString()}</span>
                </div>

                <div className="flex justify-between p-4 bg-indigo-950 text-white rounded-xl font-bold text-lg shadow-md">
                  <span>3. רווח חייב במס משוער (שורה תחתונה לדיווח)</span>
                  <span className="font-black text-xl">₪{taxableProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Edit Business Information Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                הגדרות בעל/ת העסק
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                setBusinessInfo({
                  ownerName: fd.get('ownerName'),
                  businessTitle: fd.get('businessTitle'),
                  taxType: fd.get('taxType'),
                  taxId: fd.get('taxId'),
                  phone: fd.get('phone'),
                  email: fd.get('email'),
                  defaultRate: Number(fd.get('defaultRate'))
                });
                triggerManualSaveNotice();
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">שם בעל/ת העסק *</label>
                    <input
                      type="text"
                      name="ownerName"
                      defaultValue={businessInfo.ownerName}
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">תיאור העסק</label>
                    <input
                      type="text"
                      name="businessTitle"
                      defaultValue={businessInfo.businessTitle}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">סוג עוסק</label>
                    <select
                      name="taxType"
                      defaultValue={businessInfo.taxType}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="exempt">עוסק פטור</option>
                      <option value="registered">עוסק מורשה</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">מספר עוסק / ת.ז</label>
                    <input
                      type="text"
                      name="taxId"
                      defaultValue={businessInfo.taxId}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">מחיר ברירת מחדל לשיעור (₪)</label>
                    <input
                      type="number"
                      name="defaultRate"
                      defaultValue={businessInfo.defaultRate}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition"
                  >
                    <Save className="w-4 h-4" />
                    עדכן פרטי עסק
                  </button>
                </div>
              </form>
            </div>

            {/* Advanced IndexedDB & File Backup Operations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                גיבוי עמיד במכשיר (IndexedDB + JSON)
              </h3>

              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  מערכת הזיכרון הכפולה פעילה (IndexedDB Persistence):
                </p>
                <p>האפליקציה שומרת את הנתונים באופן עמיד במסד נתונים פנימי (IndexedDB). גם בעת סגירת הדפדפן בכרום בסלולרי, השינויים יישמרו במלואם.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition"
                >
                  <Download className="w-4 h-4" />
                  ייצא קובץ גיבוי (JSON)
                </button>

                <label className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  טען קובץ גיבוי (JSON)
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleResetData}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  אפס את כל הנתונים במערכת
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingStudent ? 'עריכת פרטי תלמיד/ה' : 'הוספת תלמיד/ה חדש/ה'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">שם מלא *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingStudent?.name || ''}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">כיתה / רמה</label>
                  <input
                    type="text"
                    name="grade"
                    defaultValue={editingStudent?.grade || ''}
                    placeholder="למשל: כיתה י_3 (5 יחידות)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">מחיר לשיעור (₪) *</label>
                  <input
                    type="number"
                    name="rate"
                    defaultValue={editingStudent?.rate || businessInfo.defaultRate}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">מספר טלפון ליצירת קשר</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingStudent?.phone || ''}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">הערות נוספות</label>
                <textarea
                  name="notes"
                  rows="2"
                  defaultValue={editingStudent?.notes || ''}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  שמור תלמיד
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingLesson ? 'עריכת שיעור' : 'תיעוד שיעור חדש'}
            </h3>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">בחר תלמיד/ה *</label>
                <select
                  name="studentId"
                  defaultValue={editingLesson?.studentId || (students[0] ? students[0].id : '')}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.grade || 'ללא כיתה'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">תאריך השיעור *</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingLesson?.date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">סכום לתשלום (₪) *</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingLesson?.amount || businessInfo.defaultRate}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">משך (דקות)</label>
                  <input
                    type="number"
                    name="duration"
                    defaultValue={editingLesson?.duration || 60}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">אמצעי תשלום</label>
                  <select
                    name="payMethod"
                    defaultValue={editingLesson?.payMethod || 'Bit'}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Bit">Bit</option>
                    <option value="PayBox">PayBox</option>
                    <option value="העברה בנקאית">העברה בנקאית</option>
                    <option value="מזומן">מזומן</option>
                    <option value="אשראי">אשראי</option>
                    <option value="שיק">שיק</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">סטטוס תשלום</label>
                  <select
                    name="status"
                    defaultValue={editingLesson?.status || 'paid'}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="paid">שולם</option>
                    <option value="unpaid">טרם שולם</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">מספר חשבונית / קבלה</label>
                <input
                  type="text"
                  name="invoiceNo"
                  defaultValue={editingLesson?.invoiceNo || ''}
                  placeholder="למשל: INV-1004"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">נושאי השיעור / הערות</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingLesson?.notes || ''}
                  placeholder="למשל: חדווא ופונקציות מעריכיות"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  שמור שיעור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingExpense ? 'עריכת הוצאה' : 'תיוק הוצאה/קבלה חדשה'}
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">שם הספק *</label>
                  <input
                    type="text"
                    name="supplier"
                    defaultValue={editingExpense?.supplier || ''}
                    placeholder="למשל: סטימצקי / KSP"
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">מספר קבלה/חשבונית</label>
                  <input
                    type="text"
                    name="receiptNo"
                    defaultValue={editingExpense?.receiptNo || ''}
                    placeholder="REC-1002"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">תיאור ההוצאה *</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingExpense?.description || ''}
                  required
                  placeholder="למשל: ספרי מיקוד במתמטיקה 5 יחידות"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">תאריך *</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">קטגוריית הוצאה</label>
                  <select
                    name="category"
                    defaultValue={editingExpense?.category || EXPENSE_CATEGORIES[0].label}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.label}>{cat.label} ({cat.defaultPercent}% מוכר)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">סכום ברוטו (₪) *</label>
                  <input
                    type="number"
                    name="totalAmount"
                    defaultValue={editingExpense?.totalAmount || ''}
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">אחוז מוכר במס (%)</label>
                  <input
                    type="number"
                    name="taxPercent"
                    defaultValue={editingExpense?.taxPercent !== undefined ? editingExpense.taxPercent : ''}
                    placeholder="לפי קטגוריה"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">צילום קבלה (תמונה מנייד/קובץ)</label>
                <input
                  type="file"
                  name="receiptFile"
                  accept="image/*"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">הערות</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingExpense?.notes || ''}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                >
                  שמור הוצאה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">תמונת קבלה מתויקת</h3>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
              <img src={viewingReceipt} alt="קבלה" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {}
      {selectedStudentHistory && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">כרטיס תלמיד/ה: {selectedStudentHistory.name}</h3>
                <p className="text-xs text-slate-500">{selectedStudentHistory.grade} • מחיר לשיעור: ₪{selectedStudentHistory.rate}</p>
              </div>
              <button onClick={() => setSelectedStudentHistory(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {lessons.filter(l => l.studentId === selectedStudentHistory.id).length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-sm">טרם תועדו שיעורים לתלמיד/ה זה.</p>
              ) : (
                lessons.filter(l => l.studentId === selectedStudentHistory.id).map(l => (
                  <div key={l.id} className="py-2.5 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{l.date} ({l.duration} דק')</p>
                      <p className="text-xs text-slate-500">{l.notes || 'ללא תיאור נושא'}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-900">₪{l.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${l.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {l.status === 'paid' ? 'שולם' : 'טרם שולם'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}