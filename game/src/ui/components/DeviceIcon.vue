<script setup lang="ts">
defineProps<{ id: string }>();
// Иконки устройств: линия 2,4 px, заливка бумажными тонами.
const P: Record<string, string> = {
  kettle: '<path d="M18 42h26l-3-26H21z" fill="#c9d4dc"/><path d="M21 16c0-6 20-6 20 0"/><path d="M44 20c6 0 8 4 8 9s-3 9-8 9"/><path d="M18 26l-7-6"/><rect x="14" y="42" width="34" height="4" rx="2" fill="#2a2d33"/>',
  microwave: '<rect x="6" y="8" width="52" height="32" rx="5" fill="#eef0ef"/><rect x="11" y="13" width="31" height="22" rx="3" fill="#2a2d33"/><circle cx="50" cy="18" r="2.5"/><circle cx="50" cy="26" r="2.5"/><rect x="46" y="31" width="8" height="4" rx="1" fill="#2f7d4f" stroke="none"/>',
  laptop: '<rect x="13" y="8" width="38" height="25" rx="3" fill="#2a2d33"/><path d="M6 38h52l-4-5H10z" fill="#c9ccd0"/><path d="M20 14h16M20 19h22M20 24h12" stroke="#7d9bd6" stroke-width="2"/>',
  tv: '<rect x="6" y="6" width="52" height="30" rx="3" fill="#2a2d33"/><path d="M24 42h16M32 36v6"/><path d="M12 12l8 8" stroke="#7d9bd6" stroke-width="2"/>',
  washer: '<rect x="14" y="4" width="36" height="42" rx="4" fill="#eef0ef"/><circle cx="32" cy="27" r="10" fill="#4a6a88"/><path d="M14 13h36"/><circle cx="42" cy="9" r="1.6"/>',
  fridge: '<rect x="18" y="2" width="28" height="44" rx="4" fill="#eceae2"/><path d="M18 18h28M22 8v6M22 24v8"/>',
  speaker: '<rect x="22" y="8" width="20" height="36" rx="8" fill="#5b616b"/><ellipse cx="32" cy="10" rx="9" ry="2.5" fill="#5ab0ff" stroke="none"/><path d="M27 24h10M27 30h10"/>',
  dishwasher: '<rect x="12" y="4" width="40" height="42" rx="3" fill="#d7dadc"/><path d="M12 12h40M22 18h20"/><rect x="18" y="6" width="14" height="3" fill="#5ab0ff" stroke="none"/>',
  aircon: '<rect x="4" y="12" width="56" height="18" rx="8" fill="#f4f5f3"/><path d="M10 26h44"/><path d="M18 36c2 4 2 6 0 10M32 36c2 4 2 6 0 10M46 36c2 4 2 6 0 10" stroke="#5ab0ff"/>',
  vr: '<rect x="10" y="16" width="44" height="20" rx="8" fill="#f2f2f2"/><rect x="15" y="21" width="34" height="10" rx="4" fill="#2a2d33"/><path d="M10 26H4M54 26h6"/>',
  coffee: '<rect x="16" y="4" width="32" height="40" rx="4" fill="#2a2d33"/><rect x="21" y="9" width="22" height="7" rx="2" fill="#ffb067" stroke="none"/><path d="M28 22h8v5h-8z" fill="#c9ccd0"/><path d="M27 34h10l-1 6h-8z" fill="#f2f0e8"/>',
  tennis: '<rect x="12" y="18" width="40" height="22" rx="5" fill="#2f6b4a"/><path d="M16 18l4-12h24l4 12" fill="#1b1d22"/><circle cx="26" cy="10" r="3" fill="#d7f05a"/><circle cx="36" cy="10" r="3" fill="#d7f05a"/><circle cx="18" cy="42" r="4" fill="#2a2d33"/><circle cx="46" cy="42" r="4" fill="#2a2d33"/>',
  robovac: '<ellipse cx="32" cy="28" rx="24" ry="14" fill="#2a2d33"/><ellipse cx="32" cy="24" rx="16" ry="8" fill="#3e4148"/><circle cx="32" cy="22" r="4" fill="#c9ccd0"/><path d="M28 32h8" stroke="#4cff9a"/>',
  printer: '<rect x="8" y="16" width="48" height="22" rx="3" fill="#e8eaec"/><path d="M18 16V6h28v10" fill="#fff"/><path d="M18 38v6h28v-6" fill="#fff"/><rect x="40" y="21" width="10" height="5" fill="#1b2a4a" stroke="none"/>',
  projector: '<rect x="8" y="16" width="48" height="20" rx="6" fill="#f2f2f0"/><circle cx="22" cy="26" r="7" fill="#2a4a6a"/><path d="M40 22h10M40 26h10M40 30h10"/>',
};
</script>

<template>
  <svg viewBox="0 0 64 48" width="64" height="48" fill="none" stroke="#2a2d33" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" v-html="P[id] ?? P.microwave" />
</template>
