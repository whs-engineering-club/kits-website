// 3D build models for the ECE kit. Steps match data/kits.mjs.
const RED = 0xd23f3f, BLACK = 0x26262a, ORANGE = 0xf08a24, YELLOW = 0xe6c229, GREEN = 0x3aa655, BROWN = 0x6b4226;

// A flat "hand" used to show covering or approaching a sensor.
const hand = (b, pos, upright) => b.part(
  upright ? b.mk.box(4.2, 5, 0.9, 0xe0b48c, pos) : b.mk.box(4.2, 0.9, 5, 0xe0b48c, pos),
  upright ? b.mk.box(0.9, 2.6, 0.8, 0xe0b48c, [pos[0] - 2.4, pos[1] - 0.6, pos[2]], [0, 0, 0.5])
    : b.mk.box(0.9, 0.8, 2.6, 0xe0b48c, [pos[0] - 2.4, pos[1], pos[2] + 0.4], [0, 0.5, 0]),
);

export default {
  'led-circuit': (b) => {
    b.step(0); b.breadboard(); const bat = b.battery();
    b.step(1, { only: true });
    const loose = b.led([-1, 4, 0], [0, 4, 0]);
    b.label('Long leg = positive (+)', [-1.6, 5.6, 0]);
    b.label('Short leg = negative (−)', [1.2, 4.2, 0]);
    b.effect(() => loose.glow(0.15));
    b.step(2); const led = b.led('c8', 'c9'); b.label('LED: one leg per column', led.top);
    b.step(3); b.resistor('a4', 'a8'); b.label('Resistor: LED long-leg column → empty column', [-3, 3, -5.5]);
    b.step(4); b.wire(bat.plus, 'b4', RED); b.label('Battery + (red)', bat.plus.clone().setY(3.5));
    b.step(5); b.wire(bat.minus, 'e9', BLACK); b.label('Battery − (black) → LED short-leg column', [0, 3.6, -1.5]);
    b.step(6); b.label('Lit!', led.top);
    b.effect((s) => led.glow(s >= 5 ? 2.2 : 0.15));
  },

  'button-buzzer': (b) => {
    b.step(0); b.breadboard(); const bat = b.battery();
    b.step(1); const btn = b.button(5); b.label('Button across the centre gap', btn.top);
    b.step(2); const buz = b.buzzer('h11', 'h14'); b.label('Buzzer (+ mark on the left leg)', buz.top);
    b.step(3); b.wire(bat.plus, 'a5', RED); b.label('Battery + → one side of the button', [-4, 3.6, -5.5]);
    b.step(4); b.wire('h7', 'i11', YELLOW); b.label('Other side of button → buzzer +', [0, 3.6, 4]);
    b.step(5); b.wire('i14', bat.minus, BLACK, { lift: 3 }); b.label('Buzzer − → battery −', [5, 3.4, 4.5]);
    b.step(6); b.label('Press = sound', btn.top);
    b.effect((s, t) => btn.press(s === 6 && t % 1.6 < 0.8));
    b.step(6);
    const ring = b.torus(2.6, 0.08, 0xf7871f, [3.5, 3.6, 3.5], [Math.PI / 2, 0, 0]);
    b.effect((s, t) => { const on = s === 6 && t % 1.6 < 0.8; ring.visible = on; ring.scale.setScalar(1 + ((t % 0.4) / 0.4) * 0.6); });
  },

  'light-sensor': (b) => {
    b.step(0); b.breadboard(); const bat = b.battery();
    b.step(1); const led = b.led('c8', 'c9'); b.resistor('a4', 'a8'); b.wire(bat.minus, 'e9', BLACK);
    b.label('Start with the basic LED circuit', led.top);
    b.step(1, { only: true }); b.wire(bat.plus, 'b4', RED);
    b.step(2, { only: true }); b.label('Red wire removed', [-6, 3, -4.5]);
    b.step(3); const ldr = b.photoresistor('c2', 'c4'); b.wire(bat.plus, 'a2', RED);
    b.label('Photoresistor fills the gap', ldr.top);
    b.step(4, { only: true });
    b.part(b.mk.cyl(1.2, 5, 0x3a3a40, [-8, 9, -9], { rot: [0.9, 0, -0.5] }), b.mk.cyl(1.7, 1.2, 0xf4e9a8, [-7.2, 7.2, -7.6], { rot: [0.9, 0, -0.5], emissive: 0xf4e9a8 }));
    b.label('Bright light → LED bright', led.top);
    b.step(5, { until: 6 }); hand(b, [-6, 4.4, -3.5]);
    b.step(5, { only: true }); b.label('Covered → LED dim', led.top);
    b.step(6, { only: true }); b.label('Record what you saw', led.top);
    b.effect((s) => led.glow(s === 1 ? 2 : s === 2 ? 0.1 : s === 3 ? 1 : s === 4 ? 2.6 : 0.35));
  },

  'mcu-led': (b) => {
    b.step(0); b.breadboard(); const uno = b.arduino();
    b.step(1);
    const led = b.led('c8', 'c9'); b.resistor('a4', 'a8');
    b.wire(uno.pin(9), 'b4', ORANGE); b.wire('e9', uno.pin('GND'), BLACK);
    b.label('Pin 9', uno.pin(9).setY(3)); b.label('GND', uno.pin('GND').setY(3));
    b.label('Pin 9 → resistor → LED long leg', [-3, 3.2, -5.5]);
    b.step(2, { only: true }); b.label('Check the wiring before plugging in', led.top);
    b.step(3); b.usbCable(uno); b.label('USB to the laptop', uno.usb.clone().setY(4));
    b.step(4, { only: true }); b.label('Blinks once per second', led.top);
    b.step(5, { only: true }); b.label('delay(200) → blinks faster', led.top);
    b.effect((s, t) => led.glow(s < 4 ? 0.15 : (t % (s === 5 ? 0.4 : 2) < (s === 5 ? 0.2 : 1) ? 2.4 : 0.15)));
  },

  'sensor-servo': (b) => {
    b.step(0); b.breadboard(); const uno = b.arduino();
    b.step(1);
    b.wire(uno.pin('5V'), 'a15', RED); b.wire(uno.pin('GND'), 'a17', BLACK);
    b.label('5V column', [6, 3.4, -5.5]); b.label('GND column', [8.6, 2.4, -5.5]);
    b.step(2);
    const servo = b.servo([17, 0, 3]);
    b.wire(servo.lead, 'c15', RED, { lift: 2 }); b.wire(servo.lead.clone().add({ x: 0, y: 0, z: 0.5 }), 'c17', BROWN, { lift: 1.4 });
    b.wire(servo.lead.clone().add({ x: 0, y: 0, z: -0.5 }), uno.pin(9), ORANGE, { lift: 5 });
    b.label('Servo: red → 5V, brown → GND, orange → pin 9', servo.top);
    b.step(3);
    const sonar = b.ultrasonic(5);
    b.wire('h5', 'd15', RED, { lift: 3.2 }); b.wire('h8', 'd17', BLACK, { lift: 2.4 });
    b.wire('h6', uno.pin(7), YELLOW, { lift: 6 }); b.wire('h7', uno.pin(6), GREEN, { lift: 5 });
    b.label('VCC · TRIG → 7 · ECHO → 6 · GND', sonar.top);
    b.step(4); servo.horn.add(b.add(b.mk.box(0.12, 2.6, 2.2, 0xf7d046, [3.6, 1.5, 0])));
    b.label('Paper flag taped to the horn', servo.top);
    b.step(5); b.usbCable(uno); b.label('Upload the sketch', uno.usb.clone().setY(4));
    b.step(6, { until: 7 }); const h = hand(b, [-2.5, 4, 13], true);
    b.step(6, { only: true }); b.label('Closer than 15 cm → arm lifts', servo.top);
    b.step(7, { only: true }); b.label('Change the 15 and test again', servo.top);
    b.effect((s, t) => {
      const near = s >= 6 && Math.sin(t * 1.6) > 0;
      if (s >= 6) h.position.z = h.userData.rest + (near ? 0 : 9);
      const want = near ? Math.PI / 2 : 0;
      servo.horn.rotation.z += (want - servo.horn.rotation.z) * 0.15;
    });
    h.userData.rest = h.position.z;
  },

  'ece-final': (b) => {
    b.step(0); b.breadboard(); const uno = b.arduino();
    b.step(1, { only: true }); b.label('Pick: night light, alarm, or assistive device', [0, 6, 0]);
    b.step(2, { only: true }); b.label('Who is it for? What should it do?', [0, 6, 0]);
    b.step(3, { only: true });
    b.label('INPUT: sensor', [-6, 4, 0]); b.label('DECISION: code', uno.top); b.label('OUTPUT: light, sound or motion', [5, 4, 0]);
    b.step(4);
    const ldr = b.photoresistor('c2', 'c4');
    b.wire(uno.pin('5V'), 'a2', RED); b.wire('a4', uno.pin('A0'), YELLOW, { lift: 5 });
    b.resistor('d4', 'd7', { bands: [0x6b3f1d, 0x111111, 0xf08a24] }); b.wire('a7', uno.pin('GND'), BLACK);
    b.wire(uno.pin(9), 'a10', ORANGE, { lift: 6 }); b.resistor('c10', 'c13');
    const led = b.led('d13', 'd14'); b.wire('a14', uno.pin('GND2'), BLACK);
    b.label('Photoresistor: 5V → A0', ldr.top); b.label('10kΩ: A0 → GND', [-3.5, 2.6, -2.5]); b.label('LED on pin 9', led.top);
    b.step(5, { only: true }); b.label('Alarm: swap in a button or ultrasonic sensor, and the buzzer', [0, 6, 0]);
    b.step(6, { only: true }); b.label('Assistive: big button or sensor → servo, buzzer or light', [0, 6, 0]);
    b.step(7);
    const card = { opacity: 0.4, double: true };
    b.part(
      b.mk.box(22, 9, 0.3, 0xb98b5a, [0, 4.5, -7.6], null, card), b.mk.box(0.3, 9, 15, 0xb98b5a, [-11, 4.5, 0], null, card),
      b.mk.box(0.3, 9, 15, 0xb98b5a, [11, 4.5, 0], null, card),
    );
    b.label('Cardboard housing', [0, 9.6, -7.6]);
    b.step(8); const h = hand(b, [-6, 4.6, -3.5]); b.label('Dark → light turns on', led.top);
    b.effect((s, t) => {
      const dark = s === 8 && Math.sin(t * 1.4) > 0;
      h.visible = s === 8 && dark;
      led.glow(dark ? 2.4 : 0.15);
    });
  },
};
