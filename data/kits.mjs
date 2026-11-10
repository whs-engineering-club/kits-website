// Single source of truth for the site and the API.
// Kit contents, concepts, project lists, the Arduino mini-unit and the parts
// links come from the club's planning spreadsheet. The step-by-step build
// guides were written to go with those project lists.
// After editing, run `npm run build` to regenerate site/data.js.

const p = (id, title, time, level, summary, materials, steps, test, why, extra = {}) => ({
  id, title, time, level, summary, materials, steps, test, why, ...extra,
});

export const kits = [
  {
    id: 'ece',
    code: 'ECE',
    name: 'Electrical & Computer Engineering Kit',
    tagline: 'Circuits, sensors and code — from a single LED to a working alarm.',
    cost: 'Student kit: around $3–$5',
    studentKit: [
      'Mini breadboard',
      '5 LEDs',
      '5 resistors',
      '1 button / switch',
      '1 buzzer',
      '1 photoresistor or thermistor',
      '1 coin cell holder or AA battery holder',
      '8–10 jumper wires',
      'Small printed circuit challenge card',
    ],
    classroomToolbox: [
      'Microcontrollers (ESP32, RP2040)',
      'SG90 servos',
      'Potentiometers',
      'Ultrasonic sensors',
      'Motor drivers',
      'Multimeters',
      'USB cables',
      'Laptops / Chromebooks',
    ],
    concepts: [
      'Complete circuits', 'Voltage and ground', 'Current limiting', 'LED polarity',
      'Inputs and outputs', 'Digital pins', 'Sensors', 'Programs and loops',
    ],
    sourcing: [
      {
        part: 'Resistors and LEDs',
        links: [
          { label: 'Amazon – resistor & LED assortment', url: 'https://www.amazon.com/WayinTop-Resistor-Assortment-Respberry-Resistors/dp/B07YWNHZHS' },
          { label: 'Alibaba – resistor & LED kit', note: 'minimum order 1 piece', url: 'https://www.alibaba.com/product-detail/Metal-Film-Resistor-Assortment-kit-LED_1600094619956.html' },
          { label: 'Alibaba – 1818-piece components kit', url: 'https://www.alibaba.com/product-detail/1818PCS-Electronic-Components-Diy-Kit-Metal_1601178397454.html' },
        ],
      },
      {
        part: 'Breadboard',
        links: [
          { label: 'Amazon – breadboard pack', url: 'https://www.amazon.com/ZUQIAN-Breadboard-Breadboards-Distribution-Electronics/dp/B0CWKQFR97' },
          { label: 'Alibaba – 170-point mini breadboard', note: 'cheapest; 10 order minimum', url: 'https://www.alibaba.com/product-detail/China-Manufacturer-Bulk-170-Points-Mini_402044081.html' },
        ],
      },
      {
        part: 'Microcontroller',
        links: [
          { label: 'Amazon – ELEGOO ESP32 board', url: 'https://www.amazon.com/ELEGOO-ESP-WROOM-32-Development-Bluetooth-Microcontroller/dp/B0D8T53CQ5' },
          { label: 'Alibaba – ATmega328P Uno-style board', note: 'best option; 500+ orders, no minimum', url: 'https://www.alibaba.com/product-detail/High-Quality-MEGA328P-for-Arduinos-UNO_1601291969226.html' },
        ],
      },
      {
        part: 'Buzzer',
        links: [
          { label: 'Amazon – passive buzzers', url: 'https://www.amazon.com/Passive-Resistance-Electronic-Magnetic-Continuous/dp/B0F1KFHSNK' },
          { label: 'Alibaba – buzzer', note: 'minimum 100 pieces ($9)', url: 'https://www.alibaba.com/product-detail/FS-12085-3V-16R-5V-42R_1601379067085.html' },
        ],
      },
      {
        part: 'Servo',
        links: [
          { label: 'Amazon – 10-pack SG90 servos', url: 'https://www.amazon.com/10Pcs-Servos-Helicopter-Airplane-Controls/dp/B08KY49SFX' },
          { label: 'Alibaba – SG90 9g micro servo', url: 'https://www.alibaba.com/product-detail/SG90-9G-Mini-Micro-Servo-Steering_1601784400178.html' },
          { label: 'Alibaba – SG90 / MG90S servo', url: 'https://www.alibaba.com/product-detail/SG90-MG90S-9g-Digital-Servo-14g_1601784374336.html' },
        ],
      },
    ],
    projects: [
      p('led-circuit', 'Build a basic LED circuit', '20 min', 'Starter',
        'Light an LED from a battery and learn why every circuit needs a complete loop.',
        ['Mini breadboard', '1 LED', '1 resistor (220Ω or 330Ω)', 'Battery holder with battery', '2 jumper wires'],
        [
          'Find the two legs of the LED. The long leg is positive (+), the short leg is negative (−).',
          'Push the LED into the breadboard so each leg sits in a different row.',
          'Put one end of the resistor in the same row as the LED\'s long leg, and the other end in an empty row.',
          'Connect the battery holder\'s red (+) wire to the free end of the resistor.',
          'Connect the battery holder\'s black (−) wire to the row holding the LED\'s short leg.',
          'The LED should light. If not, flip the LED around and check every part is pushed in firmly.',
        ],
        'Pull out any one wire. The LED goes dark because the loop is broken. Put it back and it lights again.',
        'Electricity only flows around a complete path from + back to −. The resistor limits the current so the LED does not burn out, and the LED only lets current through in one direction.',
        { extend: 'Add a second LED in the same loop (series), then try it side by side with the first (parallel). Which is brighter?' }),
      p('button-buzzer', 'Build a button-controlled buzzer', '20 min', 'Starter',
        'Make a doorbell: the buzzer sounds only while the button is held down.',
        ['Mini breadboard', '1 button / switch', '1 buzzer', 'Battery holder with battery', '3 jumper wires'],
        [
          'Place the button across the centre gap of the breadboard so its legs sit on both sides.',
          'Place the buzzer nearby. If it has a + mark, note which leg that is.',
          'Connect battery + to one side of the button.',
          'Connect the other side of the button to the buzzer\'s + leg.',
          'Connect the buzzer\'s other leg to battery −.',
          'Press the button. The buzzer should sound only while you hold it.',
        ],
        'Release the button: silence. Press: sound. If it buzzes all the time, the button is rotated — turn it 90° and try again.',
        'A button is a gap in the circuit that you close with your finger. Pressing it completes the loop; letting go breaks it.',
        { extend: 'Tap out your initials in Morse code and have a partner decode them.' }),
      p('light-sensor', 'Build a light sensor circuit', '30 min', 'Core',
        'Use a photoresistor so an LED changes brightness as the light in the room changes.',
        ['Mini breadboard', '1 photoresistor', '1 LED', '1 resistor', 'Battery holder with battery', '3 jumper wires'],
        [
          'Build the basic LED circuit first and check that it lights.',
          'Remove the wire between battery + and the resistor.',
          'Put the photoresistor in that gap: one leg to battery +, the other leg to the resistor. It has no polarity, so either way round works.',
          'Shine a light on the photoresistor and watch the LED.',
          'Cover the photoresistor with your hand and watch again.',
          'Write down what you saw in both cases.',
        ],
        'The LED is brighter when the sensor is lit and dimmer when it is covered.',
        'A photoresistor\'s resistance drops in bright light and rises in the dark. More resistance means less current, so the LED dims. A thermistor works the same way with temperature.',
        { extend: 'This circuit is brighter in the light. A night light needs the opposite — that is what the final project and a microcontroller are for.' }),
      p('mcu-led', 'Use a microcontroller to control an LED', '45 min', 'Core',
        'Move the LED from the battery to a pin that code can switch on and off, then make it blink.',
        ['Microcontroller board and USB cable', 'Laptop / Chromebook with the Arduino editor', 'Breadboard', '1 LED', '1 resistor (220Ω or 330Ω)', '2 jumper wires'],
        [
          'Wire pin 9 → resistor → LED long leg. Wire the LED short leg → GND.',
          'Have a teacher or partner check the circuit before plugging in the USB cable.',
          'Open the Arduino editor, select your board and port, and type in the sketch below.',
          'Upload it. The LED should blink once per second.',
          'Change both delay values to 200 and upload again. Predict what will happen before you press upload.',
        ],
        'The LED blinks, and it blinks faster when the delay numbers get smaller.',
        'A digital pin is like a light switch controlled by code. HIGH sends power out of the pin; LOW stops it. The loop repeats forever, so the LED keeps blinking.',
        {
          note: 'Pin numbers are for an Uno-style board. On an ESP32 or RP2040 board, use any free GPIO pin and change the number in the code.',
          code: `const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);   // the pin sends power out
}

void loop() {
  digitalWrite(LED_PIN, HIGH); // LED on
  delay(1000);                 // wait one second
  digitalWrite(LED_PIN, LOW);  // LED off
  delay(1000);
}`,
        }),
      p('sensor-servo', 'Use a sensor to trigger a servo', '60 min', 'Advanced',
        'Read an ultrasonic distance sensor and swing a servo arm when something gets close — an automatic gate.',
        ['Microcontroller board and USB cable', 'Laptop / Chromebook', 'Ultrasonic sensor (HC-SR04 type)', 'SG90 servo', 'Breadboard', 'Jumper wires'],
        [
          'Run a wire from the board\'s 5V pin to an empty breadboard column, and another from GND to a second empty column. The servo and sensor will share these two columns.',
          'Servo: red wire → the 5V column, brown wire → the GND column, orange wire → pin 9.',
          'Ultrasonic sensor: push its four pins into the breadboard. VCC → the 5V column, GND → the GND column, TRIG → pin 7, ECHO → pin 6.',
          'Tape a craft stick or paper flag to the servo horn so the movement is easy to see.',
          'Type in the sketch below and upload it.',
          'Move your hand toward the sensor. Inside 15 cm the arm should swing up; move away and it drops.',
          'Change the 15 to another distance and test again.',
        ],
        'The arm lifts when an object is closer than the set distance and lowers when the object moves away.',
        'The sensor sends out a sound pulse and times the echo. The microcontroller turns that time into a distance, compares it with a threshold, and tells the servo which angle to move to. Input → decision → output.',
        {
          note: 'Pin numbers are for a 5V Uno-style board. On a 3.3V board such as an ESP32 or RP2040, the sensor\'s ECHO pin needs a voltage divider before it connects to the board, and the Servo library differs — ask a club mentor.',
          code: `#include <Servo.h>

const int TRIG = 7, ECHO = 6, SERVO_PIN = 9;
Servo arm;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  arm.attach(SERVO_PIN);
}

void loop() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long echoTime = pulseIn(ECHO, HIGH, 30000);
  long cm = echoTime / 58;          // time -> distance

  if (cm > 0 && cm < 15) arm.write(90);  // something close: lift
  else                   arm.write(0);   // nothing there: lower
  delay(100);
}`,
        }),
      p('ece-final', 'Final project: night light, mini alarm or assistive device', '2–3 class periods', 'Capstone',
        'Combine an input, a decision and an output into a device that solves a real problem.',
        ['Everything in the student kit', 'Microcontroller, sensors and servo from the classroom toolbox', 'Cardboard and tape for a housing'],
        [
          'Pick one: an automatic night light, a mini alarm system, or a simple assistive device.',
          'Write one sentence: who is it for and what should it do?',
          'Fill in the plan: my input is ___, my output is ___, the rule is "when ___ then ___".',
          'Night light: photoresistor from 5V to pin A0, plus a 10kΩ resistor from A0 to GND; LED on pin 9. Use the sketch below and tune the threshold number.',
          'Alarm: swap the photoresistor for a button or ultrasonic sensor and the LED for the buzzer.',
          'Assistive device: use a large button or sensor to trigger a servo, buzzer or light for someone who needs it.',
          'Build a cardboard housing, test with another group, and fix one thing they point out.',
          'Present: the problem, the input → decision → output, and what you would improve next.',
        ],
        'The device does what your one-sentence goal says, three times in a row, without you touching the wiring.',
        'Every smart device follows the same pattern as this kit: a sensor provides an input, code makes a decision, and an output acts on it.',
        {
          note: 'The night-light sketch needs one 10kΩ resistor from the classroom toolbox.',
          code: `const int SENSOR = A0, LED_PIN = 9;
const int DARK = 400;   // tune this number for your room

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(SENSOR);          // 0 (dark) to 1023 (bright)
  digitalWrite(LED_PIN, light < DARK ? HIGH : LOW);
  delay(100);
}`,
        }),
    ],
  },
  {
    id: 'meche',
    code: 'MECHE',
    name: 'Mechanical Engineering Kit',
    tagline: 'Bridges, towers and cranes built from craft sticks — then loaded until they fail.',
    studentKit: [
      'Popsicle sticks or craft sticks', 'Skewers', 'Straws', 'Rubber bands', 'Paper clips', 'String',
      'Cardboard strips', 'Index cards', 'Small washers or pennies as weights', 'Binder clips',
      'Small ruler', 'Design worksheet',
    ],
    classroomToolbox: [
      'Hot glue guns', 'Tape', 'Scissors', 'Digital scale', 'Calipers',
      'Force gauge or hanging weight set', '3D-printed joints / connectors', 'Small clamps',
    ],
    concepts: ['Tension', 'Compression', 'Shear', 'Bending', 'Trusses', 'Load paths', 'Factor of safety', 'Optimization', 'Cost constraints'],
    projects: [
      p('bridge', 'Bridge challenge: maximize load-to-weight ratio', '60–90 min', 'Core',
        'Build a bridge across a 30 cm gap that holds the most weight for the least material.',
        ['Craft sticks', 'Skewers', 'String', 'Hot glue or tape', 'Digital scale', 'Washers, pennies or hanging weights', 'Two desks or stacks of books'],
        [
          'Set two desks 30 cm apart. That is the gap your bridge must cross.',
          'Sketch a side view on the design worksheet. Use triangles — a row of triangles is called a truss.',
          'Build two identical side trusses flat on the table.',
          'Stand the two sides up and join them with cross-pieces along the top and bottom.',
          'Add a flat deck in the middle where the load will sit.',
          'Let the glue set fully, then weigh the bridge and record its mass.',
          'Place it across the gap and add weight at the centre, a little at a time, until it fails.',
          'Calculate the score: load held ÷ bridge mass.',
        ],
        'Record the highest load held for 10 seconds. Note which piece broke first and how — did it snap, buckle or pull apart at a joint?',
        'Triangles cannot change shape without a side changing length, so a truss turns bending into pure tension and compression along its sticks. The first piece to fail shows you the weak point in the load path.',
        { extend: 'Rebuild with 20% fewer sticks and try to beat your own ratio.' }),
      p('tower', 'Tower challenge: tallest structure holding a fixed weight', '45–60 min', 'Core',
        'Build the tallest tower you can that still holds a set weight on top for 10 seconds.',
        ['Straws', 'Skewers', 'Paper clips', 'Index cards', 'Tape', 'Fixed weight (for example a 100 g set of washers)', 'Small ruler or measuring tape'],
        [
          'Agree on the weight every tower must hold and the build time.',
          'Start with a wide base — a triangle or square with diagonal braces.',
          'Build upward in levels, making each level slightly narrower than the one below.',
          'Add a diagonal brace to every open rectangle you see.',
          'Make a small platform at the top from an index card.',
          'Measure the height, then place the weight and count 10 seconds.',
        ],
        'The tower counts only if it stands for the full 10 seconds with the weight on top. Record height and whether it leaned or buckled.',
        'A tower is mostly in compression. Tall thin members buckle sideways long before the material crushes, so bracing and a wide base matter more than strength.',
        { extend: 'Give each material a price and find the cheapest tower that reaches 50 cm.' }),
      p('crane', 'Crane arm challenge: longest cantilever that holds a load', '45–60 min', 'Core',
        'Build an arm that sticks out from the edge of a desk as far as possible while holding a weight at its tip.',
        ['Craft sticks', 'Skewers', 'String', 'Binder clips', 'Cardboard strips', 'Small clamp or tape', 'Washers or pennies in a paper-clip hook'],
        [
          'Clamp or tape the base of your arm to the edge of the desk. Nothing may touch the floor.',
          'Build the arm outward as a long, thin triangle: wide at the desk, narrow at the tip.',
          'Add a short mast standing up at the desk end.',
          'Run string from the top of the mast to the tip of the arm, like a real crane cable.',
          'Hang a paper-clip hook on the tip.',
          'Measure the reach from the desk edge, then add weight to the hook.',
        ],
        'Record the reach and the load held for 10 seconds. Score = reach × load.',
        'A cantilever bends most where it meets the support. The top of the arm is stretched (tension) and the bottom is squeezed (compression) — string is ideal on top because it is strong in tension and weighs almost nothing.',
        { extend: 'Add a counterweight behind the mast and see how much further you can reach.' }),
      p('earthquake', 'Earthquake table challenge: survive the shaking', '60 min', 'Advanced',
        'Build a structure that stays standing on a shake table while carrying weight on its top floor.',
        ['Straws or skewers', 'Index cards', 'Rubber bands', 'Tape', 'Washers as floor weight', 'Shake table: a cardboard tray resting on four marbles or rubber bands inside a box lid'],
        [
          'Make the shake table: sit a cardboard tray on marbles inside a box lid so it can slide back and forth.',
          'Build a structure at least 25 cm tall with two floors, and tape its feet to the tray.',
          'Tape the washers to the top floor.',
          'Shake gently for 10 seconds, then harder for 10 seconds. Keep the shaking the same for every team.',
          'Watch where it bends or twists first.',
          'Add cross-bracing or a wider base at that spot and test again.',
        ],
        'The structure passes if it is still standing with the weight in place after both rounds. Record how far the top swayed.',
        'Shaking pushes the base sideways while the heavy top tries to stay still, creating shear between floors. Diagonal braces resist shear; rubber-band joints add flexibility that absorbs energy.',
        { extend: 'Put rubber bands between the tray and the building feet (base isolation) and compare the sway.' }),
      p('meche-final', 'Final project: low-cost bridge, tower or rescue structure', '2–3 class periods', 'Capstone',
        'Design, budget, build and test a structure for a real scenario.',
        ['Any student kit materials', 'Shared toolbox', 'Price list for materials (set by the teacher)'],
        [
          'Choose a scenario: a footbridge over a creek, a lookout tower, or an emergency shelter frame.',
          'Write the requirements: span or height, load it must hold, and a maximum budget.',
          'Sketch two different designs and estimate the cost of each from the price list.',
          'Pick one and explain why in a sentence.',
          'Build it and weigh it.',
          'Test to the required load, then keep going to failure.',
          'Calculate factor of safety = load at failure ÷ required load.',
          'Present your design, cost, factor of safety and one change you would make.',
        ],
        'It meets the required load, stays under budget, and you can state its factor of safety.',
        'Real engineering is a trade-off: stronger usually costs more. A factor of safety says how much margin you have beyond what is needed.',
        {}),
    ],
  },
  {
    id: 'aero',
    code: 'AERO',
    name: 'Aerospace Engineering Kit',
    tagline: 'Gliders, balloon rockets and parachutes — fly it, measure it, improve it.',
    studentKit: [
      'Balloons', 'Straws', 'String', 'Paper', 'Index cards', 'Rubber bands', 'Paper clips',
      'Small propeller (optional)', 'Tape (probably shared)', 'Small foam / cardboard fins', 'Design worksheet',
    ],
    classroomToolbox: [
      'Box fan', 'Measuring tape', 'Stopwatch', 'Scale', 'Protractors',
      '3D-printed airfoil shapes', 'Simple launch track', 'Mini DC motors (optional)',
    ],
    concepts: ['Lift', 'Drag', 'Thrust', 'Stability', 'Center of mass', 'Center of pressure', 'Iteration', 'Data collection'],
    projects: [
      p('paper-airplane', 'Paper airplane optimization', '45 min', 'Starter',
        'Change one thing at a time on a paper airplane and use data to find the best design.',
        ['Paper', 'Paper clips', 'Tape', 'Measuring tape', 'Design worksheet'],
        [
          'Fold a standard dart airplane. This is your baseline.',
          'Mark a throwing line. Throw three times and record each distance.',
          'Average the three throws.',
          'Change exactly one thing: add a paper clip to the nose, bend the back edges up, or make the wings wider.',
          'Throw three more times and average again.',
          'Keep the change if it helped. Undo it if it did not.',
          'Repeat for at least three different changes.',
        ],
        'Compare the average distance of your final plane with the baseline.',
        'A paper clip moves the center of mass forward, which makes the plane more stable. Bent-up trailing edges act like elevators and lift the nose. Changing one variable at a time is the only way to know what caused the improvement.',
        { extend: 'Run the contest again for time in the air instead of distance. Does the same plane win?' }),
      p('balloon-rocket', 'Balloon rocket on a string', '30–45 min', 'Starter',
        'Send a balloon racing along a string and measure how thrust changes its speed.',
        ['Balloon', 'Straw', 'About 5 m of string', 'Tape', 'Binder clip or clothespin', 'Stopwatch', 'Measuring tape'],
        [
          'Thread the string through the straw.',
          'Tie the string tight between two chairs about 5 m apart.',
          'Blow up the balloon and pinch the neck shut with the clip. Do not tie it.',
          'Tape the balloon to the straw with the nozzle pointing back along the string.',
          'Pull the rocket to one end, start the stopwatch and release the clip.',
          'Record the distance travelled and the time.',
          'Repeat with the balloon half full and compare.',
        ],
        'Calculate speed = distance ÷ time for each run. The fuller balloon should be faster and go further.',
        'Air rushing out the back pushes the balloon forward — Newton\'s third law. More air means thrust lasts longer. The string keeps the rocket pointed straight.',
        { extend: 'Tape paper clips on as cargo. How much mass can it carry the full length of the string?' }),
      p('parachute', 'Parachute drop challenge', '45 min', 'Core',
        'Design a parachute that brings a payload down as slowly as possible.',
        ['Paper, a coffee filter or a plastic bag for the canopy', 'String', 'Tape', 'Paper clips or washers as payload', 'Stopwatch', 'Measuring tape'],
        [
          'Cut a canopy about 20 cm across.',
          'Tape four strings of equal length to its edges.',
          'Tie the free ends together and hook on the payload.',
          'Drop it from a fixed height (a marked spot 2 m up works well) and time the fall.',
          'Drop three times and average.',
          'Change the canopy size, string length or add a small hole in the centre, and test again.',
        ],
        'The longest average fall time from the same height with the same payload wins.',
        'A bigger canopy catches more air, so drag increases and the fall slows. A small vent hole lets air escape evenly and stops the parachute swinging.',
        { extend: 'Draw a target on the floor and score accuracy as well as time.' }),
      p('glider-wing', 'Glider wing design', '60 min', 'Core',
        'Build a straw-and-card glider and find the wing shape and balance point that glides furthest.',
        ['Straw (fuselage)', 'Index cards or foam (wings and tail)', 'Paper clips', 'Tape', 'Measuring tape', 'Box fan and 3D-printed airfoils for the demo'],
        [
          'Cut a main wing about 20 cm × 5 cm from an index card or foam.',
          'Cut a small horizontal tail and a vertical fin.',
          'Tape the wing about one third of the way back along the straw, and the tail at the rear.',
          'Clip a paper clip on the nose.',
          'Balance the glider on one finger. It should balance just in front of the middle of the wing — add or remove nose weight until it does.',
          'Launch gently and level. Record the distance.',
          'Change the wingspan or wing position and compare.',
        ],
        'Measure glide distance from a fixed launch height. A good glide is smooth, with no nose-dive and no stall.',
        'Wings make lift as air flows over them. The glider is stable when its center of mass is ahead of its center of pressure — that is why the nose weight matters so much.',
        { extend: 'Hold different airfoil shapes in front of the box fan and feel which makes the most lift.' }),
      p('propeller', 'Propeller car or rubber-band aircraft', '60–90 min', 'Advanced',
        'Store energy in a twisted rubber band and turn it into thrust with a propeller.',
        ['Small propeller', 'Rubber bands', 'Straws or skewers', 'Paper clips', 'Cardboard', 'Tape', 'Mini DC motor (optional)'],
        [
          'Build a light frame: a skewer or straw body about 25 cm long.',
          'Mount the propeller on a paper-clip hook at the front so it spins freely.',
          'Bend a second paper-clip hook and fix it at the back.',
          'Stretch a rubber band between the two hooks.',
          'For a car, add cardboard wheels on skewer axles. For an aircraft, add a wing and tail as in the glider project.',
          'Wind the propeller 50 turns, set it down or launch it, and let go.',
          'Record distance, then try 100 turns.',
        ],
        'Record distance travelled against number of turns. Plot the points — is it a straight line?',
        'Winding the rubber band stores elastic energy. As it unwinds, the propeller pushes air backward and the vehicle goes forward. More turns store more energy, until friction and drag eat the gain.',
        { extend: 'Swap the rubber band for a mini DC motor and battery from the toolbox.' }),
      p('aero-final', 'Final project: rescue glider or cargo-drop system', '2–3 class periods', 'Capstone',
        'Deliver a payload safely to a target using everything you have learned about flight.',
        ['Any student kit materials', 'Shared toolbox', 'A payload (for example three washers or a wrapped sweet)', 'Floor target'],
        [
          'Choose a mission: a glider that carries the payload to a target, or a drop system that releases it over the target.',
          'Write the requirements: distance to target, payload mass, and what counts as a safe landing.',
          'Sketch the design and mark where the center of mass should be.',
          'Build a first version quickly and test it.',
          'Record every flight: distance from target, landing condition.',
          'Make one change per test until it is reliable.',
          'Fly three scored attempts and present your data.',
        ],
        'Score each attempt by distance from the target, with a bonus if the payload lands undamaged.',
        'Aerospace engineering is iteration: build, fly, measure, change one thing, fly again.',
        {}),
    ],
  },
  {
    id: 'bme',
    code: 'BME',
    name: 'Biomedical Engineering Kit',
    tagline: 'Water filters, model hands and assistive devices — engineering for people.',
    studentKit: [
      'Coffee filters', 'Cotton balls', 'Sand / gravel / activated carbon, separated safely', 'Plastic cups',
      'Rubber bands', 'Straws / tubing', 'Food coloring', 'pH paper (optional)',
      'Syringe without needle (optional)', 'Design worksheet',
    ],
    classroomToolbox: [
      'Digital scale', 'Graduated cylinders or measuring cups', 'pH strips', 'Turbidity comparison chart',
      'Stopwatch', 'Safe water samples', '3D-printed valve / tube connectors',
    ],
    concepts: ['Filtration', 'Flow rate', 'Contamination', 'Tradeoffs', 'Human-centered design', 'Medical device constraints', 'Environmental testing'],
    projects: [
      p('water-filter', 'Water filter challenge', '60 min', 'Core',
        'Layer filter materials in a cup to turn cloudy water clear — and measure the trade-off with speed.',
        ['2 plastic cups', 'Coffee filter', 'Cotton balls', 'Sand', 'Gravel', 'Activated carbon', 'Rubber band', 'Safe "dirty" water sample (water with soil and a drop of food coloring)', 'Stopwatch', 'Turbidity chart', 'pH strips'],
        [
          'Poke several small holes in the bottom of one cup. This is the filter cup.',
          'Line the bottom with a coffee filter, then a layer of cotton balls.',
          'Add layers in order: activated carbon, then sand, then gravel on top.',
          'Stand the filter cup inside or above the second cup.',
          'Measure 100 mL of the dirty water sample and note its colour and cloudiness.',
          'Pour it in slowly and start the stopwatch.',
          'Stop the timer when dripping slows to a stop. Measure how much water came through.',
          'Compare the filtered water with the turbidity chart and test its pH.',
        ],
        'Record clarity (turbidity chart number), pH, volume recovered and time. Flow rate = volume ÷ time.',
        'Each layer traps smaller particles than the one above it: gravel stops debris, sand stops fine grit, carbon adsorbs colour and some chemicals. Tighter filters clean better but flow slower — that is the trade-off.',
        {
          note: 'Safety: never drink the filtered water. This filter removes particles, not germs.',
          extend: 'You have a budget of four layers. Find the order that gives the clearest water in under two minutes.',
        }),
      p('prosthetic-finger', 'Low-cost prosthetic finger', '45 min', 'Core',
        'Build a finger from cardboard, straws and string that bends when you pull a tendon.',
        ['Cardboard strip (about 10 cm × 2 cm)', 'Straw', 'String', 'Rubber band', 'Tape', 'Scissors'],
        [
          'Score two lines across the cardboard strip to make three segments. Fold along them so it bends like a finger.',
          'Cut three short pieces of straw and tape one to the palm side of each segment.',
          'Thread string through all three straw pieces.',
          'Tape or tie the string to the fingertip.',
          'Tape a rubber band along the back of the finger so it springs straight again.',
          'Pull the string. The finger should curl. Let go and it should straighten.',
        ],
        'Try to hook and lift a paper cup or a pencil with the finger. Count how many of five attempts succeed.',
        'Your real fingers contain no muscles — tendons run from muscles in your forearm, just like the string. The rubber band plays the role of the tendons that straighten your finger.',
        { extend: 'Add a soft fingertip pad and see whether grip improves.' }),
      p('hand-model', 'Hand model with straw-and-string tendons', '60 min', 'Core',
        'Scale the finger up to a whole hand with five independently controlled fingers.',
        ['Cardboard', 'Straws', 'String', 'Tape', 'Scissors', 'Pencil'],
        [
          'Trace your hand and part of your forearm on cardboard and cut it out.',
          'Mark your knuckle positions on each finger and fold along them.',
          'Tape short straw pieces between the joints on every finger, and one longer piece on the palm for each finger.',
          'Thread a separate string through each finger and down through its palm straw.',
          'Tape each string at its fingertip.',
          'Tie a loop in the free end of each string at the wrist.',
          'Pull the loops one at a time, then together, to make the hand grip.',
        ],
        'Can the hand pick up a crumpled ball of paper? Can it make a thumbs-up and a peace sign?',
        'Each finger needs its own tendon to move independently. Real prosthetic hands replace your pulling with small motors, but the tendon layout is the same idea.',
        { extend: 'Angle the thumb so it can touch the fingertips — this "opposable" thumb is what makes gripping possible.' }),
      p('assistive', 'Low-cost pill organizer or assistive grip', '60–90 min', 'Core',
        'Design a device for a specific person who finds an everyday task difficult.',
        ['Plastic cups', 'Cardboard', 'Rubber bands', 'Straws', 'Tape', 'Index cards for labels', 'Design worksheet'],
        [
          'Choose a user. Examples: a grandparent who takes pills morning and night, or someone with weak grip who struggles with pens or jar lids.',
          'Write three things the user needs. Example: "can open it with one hand", "large labels", "hard to spill".',
          'Sketch two ideas and pick one.',
          'Pill organizer: join seven cup sections in a row, add a lid flap to each, and label the days in large letters.',
          'Assistive grip: wrap layers of cardboard and rubber bands around a pen or handle until it is thick, soft and non-slip.',
          'Ask a classmate to use it while wearing thick gloves, which simulates reduced dexterity.',
          'Change one thing based on what you saw.',
        ],
        'The glove test: can a classmate complete the task wearing gloves, without instructions from you?',
        'Human-centered design starts with the person, not the gadget. Medical devices also have constraints — they must be safe, cleanable, and hard to use wrongly.',
        { note: 'Use beads or sweets as stand-in pills. Never use real medication.' }),
      p('bme-final', 'Final project: help a person or solve an environmental problem', '2–3 class periods', 'Capstone',
        'Identify a real need, build a prototype, test it and present your evidence.',
        ['Any student kit materials', 'Shared toolbox', 'Design worksheet'],
        [
          'Pick a direction: a device that helps a person, or a solution to an environmental problem such as dirty water.',
          'Describe the user or the problem in two sentences.',
          'List the requirements and constraints: cost, safety, size, ease of use.',
          'Decide how you will measure success before you build.',
          'Build a first prototype from kit materials.',
          'Test it, record the results, and improve it at least once.',
          'Present the need, your design, your test data and the trade-offs you made.',
        ],
        'You can show a measurement that proves your device works, and explain one trade-off you chose.',
        'Biomedical engineers follow this same loop: understand the need, define constraints, prototype, test with evidence.',
        {}),
    ],
  },
];

export const curriculum = {
  id: 'intro-arduino',
  kit: 'ece',
  title: 'Mini-Unit: Intro to Arduino Electronics',
  summary: 'A three-class introduction that takes students from a bare LED to a button that talks to a microcontroller.',
  lessons: [
    {
      n: 1,
      title: 'Make an LED turn on with 5V',
      length: '30–40 minutes',
      materials: ['Arduino board', 'USB cable', 'Breadboard', 'LED', '220Ω or 330Ω resistor', 'Jumper wires', 'Computer'],
      goal: 'Students build a simple circuit and turn on an LED using the Arduino\'s 5V output pin.',
      bigIdea: 'The Arduino can act like a power source. Electricity needs a complete path to flow.',
      vocabulary: [
        ['5V', 'A power pin that gives 5 volts.'],
        ['GND', 'Ground, the return path for electricity.'],
        ['Resistor', 'Protects the LED by limiting current.'],
        ['LED', 'A light that only works in one direction.'],
      ],
      sections: [
        { heading: 'Activity', body: ['Students wire:', 'Arduino 5V → resistor → long leg of LED', 'Short leg of LED → Arduino GND', 'The LED should turn on and stay on.'] },
        { heading: 'Check for understanding', body: ['Why does the LED need a resistor?', 'What does GND do?', 'What happens if the LED is flipped around?'] },
        { heading: 'Exit ticket', body: ['Draw the circuit and label: 5V, resistor, LED, GND.'] },
      ],
    },
    {
      n: 2,
      title: 'Control the LED with code',
      length: '45–60 minutes',
      topic: 'Arduino digital output',
      materials: ['Arduino', 'USB cable', 'Breadboard', 'LED', 'Resistor', 'Jumper wires', 'Computer'],
      goal: 'Students learn that an Arduino can control an LED using a digital pin and code.',
      bigIdea: 'In Class 1, the LED stayed on because it was connected directly to 5V. In this class, the LED connects to a digital pin, which can be turned on and off by the Arduino program.',
      objectives: [
        'Move an LED circuit from the 5V pin to a digital pin.',
        'Explain that a digital pin can be controlled by code.',
        'Describe what "on" and "off" mean in an Arduino program.',
        'Predict what will happen when the Arduino sends power to the LED.',
      ],
      vocabulary: [
        ['Digital pin', 'A pin on the Arduino that can be controlled by a program.'],
        ['Output', 'A signal or power sent out from the Arduino.'],
        ['On', 'The Arduino sends power to the LED.'],
        ['Off', 'The Arduino stops sending power to the LED.'],
        ['Program', 'Instructions that tell the Arduino what to do.'],
      ],
      sections: [
        { heading: '1. Review Class 1 — 5 minutes', body: ['Ask students: What made the LED turn on last class? What did the resistor do? What did GND do?', 'Remind students: "Last time, the LED was connected to 5V, so it stayed on all the time. Today, we will connect it to a pin that the Arduino can control."'] },
        { heading: '2. Introduce digital pins — 10 minutes', body: ['Show students the digital pins on the Arduino board.', 'Explain: "The 5V pin is always giving power. A digital pin is different. We can write instructions that tell the pin when to turn on and when to turn off."', 'Simple comparison: 5V pin = light switch stuck on. Digital pin = light switch controlled by code.'] },
        { heading: '3. Build the circuit — 10–15 minutes', body: ['Students build the LED circuit using a digital pin instead of 5V.', 'General connection idea: digital pin → resistor → LED → GND', 'The teacher should check each circuit before students plug in the Arduino. Check that: the resistor is included, the LED is facing the correct direction, the LED connects back to GND, and the circuit is complete.'] },
        { heading: '4. Discuss the program before coding — 10 minutes', body: ['Do not show the code yet. Instead, describe the logic in plain English.', 'The Arduino needs instructions like: set the pin as an output; turn the LED on; wait; turn the LED off; wait; repeat.', 'Ask students to act this out: one student is the Arduino, one student is the LED, and the class gives commands — "on," "wait," "off," "wait."'] },
        { heading: '5. Prediction activity — 5–10 minutes', body: ['Ask: "What do you think the LED will do if the Arduino repeats these instructions?" Students should predict: "The LED will blink."', 'Ask: "What would happen if the wait time was shorter?" Expected answer: "The LED would blink faster."', 'Ask: "What would happen if the wait time was longer?" Expected answer: "The LED would blink slower."'] },
        { heading: 'Assessment', body: ['Students can explain: why the LED is no longer connected to 5V; what a digital pin does; why the Arduino needs instructions; what will happen when the Arduino turns the pin on and off.'] },
        { heading: 'Exit ticket', body: ['How is a digital pin different from the 5V pin?', 'What does it mean for the Arduino to turn the LED on?', 'What do you think will happen when the instructions repeat?'] },
      ],
    },
    {
      n: 3,
      title: 'Button sends a signal to control a light',
      goal: 'Students will learn how a button can send a signal to the Arduino, and how the Arduino can use that signal to control an LED.',
      bigIdea: 'The push button does not directly power the LED. Instead, the button sends a signal to the Arduino board. The Arduino reads that signal and then decides whether to turn the LED on or off. Input signal → Arduino decision → Output action. For this class: Push button → Arduino → LED.',
      vocabulary: [
        ['Push button', 'Sends a signal — the input.'],
        ['Arduino', 'Reads the signal and makes a decision — the controller in the middle.'],
        ['LED', 'Turns on or off — the output.'],
      ],
      sections: [
        { heading: 'Student explanation', body: ['"When you press the button, you are not directly turning on the LED like a regular light switch. You are sending a signal to the Arduino. The Arduino notices the signal and then turns on the LED."'] },
        { heading: 'Simple analogy', body: ['A TV remote does not physically turn the TV on by itself. The remote sends a signal. The TV receives the signal. Then the TV turns on.', 'Remote button → TV receives signal → TV turns on', 'Push button → Arduino receives signal → LED turns on'] },
        { heading: '1. Review', body: ['Ask: Did the LED turn on by itself in Class 1? Did code control the LED in Class 2? What do you think the button will do today?', 'Explain: "Today, the button will not directly power the LED. The button will send information to the Arduino."'] },
      ],
    },
  ],
};

export const site = {
  club: 'WHS Engineering Club',
  title: 'Engineering Kits',
  mission: 'Low-cost engineering kits and ready-to-teach guides that the club builds for elementary and middle school classrooms.',
};
