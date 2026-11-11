import { CensusSectorData, FormField, Interviewer, SurveyRecord } from '../types/votality';

export const INITIAL_CENSUS_SECTORS: CensusSectorData[] = [
  {
    id: 'sec-01',
    name: 'Comuna 13 - San Javier',
    code: 'SEC-05001-13',
    department: 'Antioquia',
    municipality: 'Medellín',
    totalPopulation: 142500,
    sampleGoal: 850,
    center: [6.2529, -75.6178],
  },
  {
    id: 'sec-02',
    name: 'Chapinero Central',
    code: 'SEC-11001-02',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    totalPopulation: 139800,
    sampleGoal: 1100,
    center: [4.6486, -74.0628],
  },
  {
    id: 'sec-03',
    name: 'Comuna 2 - Santa Rita',
    code: 'SEC-76001-02',
    department: 'Valle del Cauca',
    municipality: 'Cali',
    totalPopulation: 115200,
    sampleGoal: 720,
    center: [3.4516, -76.542],
  },
  {
    id: 'sec-04',
    name: 'Riomar - Sector 1',
    code: 'SEC-08001-01',
    department: 'Atlántico',
    municipality: 'Barranquilla',
    totalPopulation: 168400,
    sampleGoal: 950,
    center: [11.0182, -74.8214],
  },
];

export const INITIAL_FORM_FIELDS: FormField[] = [
  {
    id: 'nombre',
    label: 'Nombre Completo',
    type: 'text',
    required: true,
    isDefault: true,
  },
  {
    id: 'direccion',
    label: 'Dirección',
    type: 'text',
    required: true,
    isDefault: true,
  },
];

export const INITIAL_INTERVIEWERS: Interviewer[] = [];

export const INITIAL_SURVEY_PINS: SurveyRecord[] = [];


