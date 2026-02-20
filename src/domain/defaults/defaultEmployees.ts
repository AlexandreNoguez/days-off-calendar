import type { Employee } from "../types/employees";
import { DEFAULT_ROLE_IDS } from "./defaultRoles";

export const DEFAULT_EMPLOYEE_IDS = {
  // Cooks
  gustavo: "emp_gustavo",
  milena: "emp_milena",
  dyson: "emp_dyson",
  alex: "emp_alex",

  // Laundry
  ingrid: "emp_ingrid",

  // Pot washer
  fernando: "emp_fernando",

  // Assistants
  clarice: "emp_clarice",
  lidriel: "emp_lidriel",
  maria: "emp_maria",
  elaine: "emp_elaine",
  josana: "emp_josana",
  luis: "emp_luis",

  // Stock assistant
  tales: "emp_tales",
} as const;

export function createDefaultEmployees(year: number): Employee[] {
  return [
    // Cooks
    {
      id: DEFAULT_EMPLOYEE_IDS.gustavo,
      name: "Gustavo",
      roleId: DEFAULT_ROLE_IDS.cook,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.milena,
      name: "Milena",
      roleId: DEFAULT_ROLE_IDS.cook,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.dyson,
      name: "Dyson",
      roleId: DEFAULT_ROLE_IDS.cook,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.alex,
      name: "Alex",
      roleId: DEFAULT_ROLE_IDS.cook,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },

    // Laundry
    {
      id: DEFAULT_EMPLOYEE_IDS.ingrid,
      name: "Ingrid",
      roleId: DEFAULT_ROLE_IDS.laundry,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },

    // Pot washer
    {
      id: DEFAULT_EMPLOYEE_IDS.fernando,
      name: "Fernando",
      roleId: DEFAULT_ROLE_IDS.potWasher,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },

    // Assistants
    {
      id: DEFAULT_EMPLOYEE_IDS.clarice,
      name: "Clarice",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.lidriel,
      name: "Lidriel",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.maria,
      name: "Maria",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.elaine,
      name: "Elaine",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.josana,
      name: "Josana",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },
    {
      id: DEFAULT_EMPLOYEE_IDS.luis,
      name: "Luís",
      roleId: DEFAULT_ROLE_IDS.assistant,
      alwaysOffSunday: false,
      holidayCreditYear: year,
      holidayOffUsed: false,
    },

    // Stock assistant (Tales always off on Sundays)
    {
      id: DEFAULT_EMPLOYEE_IDS.tales,
      name: "Tales",
      roleId: DEFAULT_ROLE_IDS.stockAssistant,
      alwaysOffSunday: true,
      holidayCreditYear: year,
      holidayOffUsed: false,
      notes: "Trabalha de segunda a sábado, folga sempre aos domingos.",
    },
  ];
}
