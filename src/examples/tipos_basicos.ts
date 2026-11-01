import type { Example } from '../types';

export const tiposBasicosExample: Example = {
  id: 'tipos_basicos',
  category: 'basics',
  difficulty: 'basic',
  title: {
    es: 'Tipos y Variables',
    en: 'Types and Variables',
  },
  description: {
    es: 'Demostración del sistema de tipos estricto y seguro de Ada, con subtipos acotados por rango y formateo con atributos estándar.',
    en: "Demonstration of Ada's strict, safe type system, with range-constrained subtypes and standard attribute formatting.",
  },
  whatToObserve: {
    es: [
      'Definición de tipos y subtipos con restricciones de rango numérico explícitas.',
      "El atributo estándar 'Image convierte valores escalares a texto de forma segura.",
      'Ada previene desbordamientos y mezclas de tipos no compatibles en tiempo de compilación.',
    ],
    en: [
      'Definition of types and subtypes with explicit numeric range constraints.',
      "The standard 'Image attribute safely converts scalar values to strings.",
      'Ada prevents overflows and incompatible type mixing at compile time.',
    ],
  },
  code: `-- ============================================
-- EJEMPLO: Tipos y Variables en Ada
-- ============================================
-- Ada es un lenguaje fuertemente tipado. Previene
-- desbordamientos y mezclas accidentales de tipos
-- mediante comprobaciones estáticas y en tiempo
-- de ejecución.
--
-- Qué observar:
--   * Definición de subtipos con rangos explícitos (ej. 1 .. 100)
--   * El atributo 'Image convierte números a cadenas
--   * Inicialización de variables obligatoria o explícita
-- ============================================

with Ada.Text_IO; use Ada.Text_IO;

procedure Tipos_Basicos is
   type Temperatura is new Float range -50.0 .. 150.0;
   subtype Porcentaje is Integer range 0 .. 100;

   Temp_Actual : Temperatura := 23.5;
   Bateria     : Porcentaje := 85;
   Activo      : Boolean := True;
begin
   Put_Line ("=== Demostración de Tipos en Ada ===");
   Put_Line ("Temperatura actual: " & Temperatura'Image (Temp_Actual) & " °C");
   Put_Line ("Nivel de batería:   " & Porcentaje'Image (Bateria) & " %");
   Put_Line ("Sistema activo:     " & Boolean'Image (Activo));
end Tipos_Basicos;`,
  expectedOutput: `=== Demostración de Tipos en Ada ===
Temperatura actual:  2.35000E+01 °C
Nivel de batería:    85 %
Sistema activo:     TRUE`,
  taskEvents: [
    { timestamp: 0, taskId: 'task_main', taskName: 'Main', event: 'created' },
    { timestamp: 50, taskId: 'task_main', taskName: 'Main', event: 'running' },
    { timestamp: 200, taskId: 'task_main', taskName: 'Main', event: 'terminated' },
  ],
};

export default tiposBasicosExample;
