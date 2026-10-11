import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Course {
  code: string;
  name: string;
  type: "CORE" | "ELECTIVE";
}
export interface Payment {
  date: string;
  type: string;
  description: string;
  currency: string;
  amount: number;
  balance: number;
}

export const useStudentPortalStore = defineStore("studentPortal", () => {
  const isAuthenticated = ref(false);

  const student = ref({
    name: "Tadiwa Dzarira",
    idNumber: "63-2448875D22",
    studentNumber: "N02530064B",
    programme: "SCS",
    programmeName: "Bachelor of Science in Computer Science",
    address: "Block 59 I, Harare, Zimbabwe",
    phone: "263737960740",
    gender: "Male",
    dob: "2005-10-05",
    placeOfBirth: "Harare",
    academicYear: "2026",
    part: 2,
    semester: 1,
    registrationStatus: "REGISTERED",
    feesBalance: -0.68,
    paymentPlan: false,
    libraryFines: 0.00,
  });

  const courses = ref<Course[]>([
    { code: "SCS2104", name: "Systems Analysis and Design", type: "CORE" },
    { code: "SCS2108", name: "Object Oriented Software Concepts and Development", type: "CORE" },
    { code: "SCS2110", name: "Research Methods", type: "CORE" },
    { code: "SCS2111", name: "Data Communications and Computer Networks", type: "CORE" },
    { code: "SCS2114", name: "Web Development", type: "CORE" },
    { code: "SORS2110", name: "Introduction to Applied Statistics", type: "CORE" },
  ]);

  const zigPayments = ref<Payment[]>([
    {
      date: "2026-02-07",
      type: "PAYMENT",
      description: "Tuition Fees",
      currency: "ZIG",
      amount: -7620,
      balance: -257.76,
    },
    {
      date: "2026-02-07",
      type: "PAYMENT",
      description: "Tuition Fees",
      currency: "ZIG",
      amount: -6000,
      balance: -234.46,
    },
    {
      date: "2025-12-31",
      type: "INVOICE",
      description: "Debtors Rev Profit on Exchange rate",
      currency: "ZIG",
      amount: 28.11,
      balance: 0.0,
    },
    {
      date: "2025-08-25",
      type: "PAYMENT",
      description: "Tuition Fees",
      currency: "ZIG",
      amount: -18090,
      balance: -675.95,
    },
  ]);

  const usdPayments = ref<Payment[]>([
    {
      date: "2026-08-24",
      type: "INVOICE",
      description: "UG-P2SP1-SCS-2025-BYO-2-Y2-S1",
      currency: "USD",
      amount: 745,
      balance: 0,
    },
    {
      date: "2026-02-11",
      type: "INVOICE",
      description: "UG-P2SP1-SCS-2025-BYO-2-Y1-S2",
      currency: "USD",
      amount: 745,
      balance: 0,
    },
    {
      date: "2025-08-28",
      type: "INVOICE",
      description: "UG-P2SP1-SCS-2025-BYO-2-Y1-S1",
      currency: "USD",
      amount: 745,
      balance: 0,
    },
    {
      date: "2025-06-26",
      type: "PAYMENT",
      description: "Tuition Fees",
      currency: "USD",
      amount: -75,
      balance: 0,
    },
  ]);

  const examResults = ref([
    { code: "SCS1101", name: "Fundamentals of Programming", credits: 12, grade: "A", score: 78 },
    { code: "SCS1102", name: "Computer Organisation", credits: 10, grade: "B+", score: 69 },
    { code: "SCS1103", name: "Discrete Mathematics", credits: 10, grade: "B", score: 62 },
    { code: "SCS1104", name: "Systems Analysis & Design I", credits: 12, grade: "A-", score: 74 },
    { code: "SCS1201", name: "Data Structures", credits: 12, grade: "A", score: 80 },
    { code: "SCS1202", name: "Database Systems", credits: 10, grade: "B+", score: 71 },
  ]);

  const gradePoints: Record<string, number> = {
    A: 4,
    "A-": 3.7,
    "B+": 3.5,
    B: 3,
    "B-": 2.7,
    C: 2,
    D: 1,
    F: 0,
  };

  const gpa = computed(() => {
    const totalCredits = examResults.value.reduce((total, result) => total + result.credits, 0);
    if (totalCredits === 0) return "0.00";

    const weightedPoints = examResults.value.reduce(
      (total, result) => total + (gradePoints[result.grade] ?? 0) * result.credits,
      0,
    );

    return (weightedPoints / totalCredits).toFixed(2);
  });

  function login(studentNumber: string, password: string) {
    const validCredentials =
      studentNumber === student.value.studentNumber && password === "portal123";
    isAuthenticated.value = validCredentials;
    return validCredentials;
  }

  function logout() {
    isAuthenticated.value = false;
  }

  return {
    student,
    courses,
    zigPayments,
    usdPayments,
    examResults,
    gpa,
    isAuthenticated,
    login,
    logout,
  };
});
