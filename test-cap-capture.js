const cap = require('cap');
const Cap = cap.Cap;
const c = new Cap();
// Intel Wi-Fi 6 AX201
const device = '\\Device\\NPF_{9F0A2CCA-7DEF-4404-A008-5D247EF04977}';
const filter = 'ip';
const bufSize = 10 * 1024 * 1024;
const buffer = Buffer.alloc(65535);

console.log('Opening device:', device);
try {
  const linkType = c.open(device, filter, bufSize, buffer);
  console.log('Link type:', linkType);
} catch (e) {
  console.error('Open error:', e.message);
  process.exit(1);
}

let packetCount = 0;
c.on('packet', (nbytes, trunc) => {
  packetCount++;
  console.log('Packet', packetCount, ':', nbytes, 'bytes, truncated:', trunc);
  if (packetCount >= 5) {
    console.log('Captured 5 packets, closing...');
    c.close();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('Timeout - captured', packetCount, 'packets');
  c.close();
  process.exit(packetCount > 0 ? 0 : 1);
}, 20000);