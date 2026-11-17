/** Новые электротехнические операции. Идентификаторы стабильны для генерации заказов. */
export const ADVANCED_A_TYPES = [
  'voltage_drop', 'diode_bridge', 'capacitor_esr', 'transistor_bias', 'relay_contacts',
  'voltage_divider', 'thermistor_curve', 'opamp_clip', 'logic_probe', 'i2c_bus',
  'crystal_clock', 'led_driver', 'audio_ground', 'sensor_pullup', 'reverse_polarity',
] as const;
export type AdvancedAType = typeof ADVANCED_A_TYPES[number];
