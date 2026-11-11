// Week-by-week lesson plans and bonus lessons for each kit, from the club's
// "STEM Kit Lesson Plans (1-2 Month Curricula)" document. Merged into each kit in kits.mjs.
// `guide` links a week or bonus lesson to the build guide it uses.
export const planInfo = {
  "format": "One 60–90 minute session per week, 6–8 weeks per kit.",
  "basis": "Every core week runs on the student kit alone. The bonus lessons need the shared classroom toolbox.",
  "flex": "Each kit compresses to about 4 weeks (one project every 1–2 sessions) or stretches past 8 weeks with more bonus lessons and a showcase day."
};

export const plans = {
  "ece": {
    "subject": "Circuits & Electronics",
    "final": "Automatic night light or mini alarm",
    "conceptsShort": "Circuits, sensing, control",
    "weeks": [
      {
        "t": "Circuit fundamentals",
        "guide": "led-circuit",
        "items": [
          "Intro to voltage, current and resistance; how a breadboard works",
          "Build a single-LED circuit with a resistor",
          "Use the challenge card to troubleshoot a \"broken\" circuit"
        ]
      },
      {
        "t": "Series vs. parallel",
        "items": [
          "Wire 2–3 LEDs in series, then in parallel",
          "Compare brightness and discuss current division",
          "Predict-then-test mini experiments"
        ]
      },
      {
        "t": "Switches & control",
        "guide": "button-buzzer",
        "items": [
          "Add the button to control an LED",
          "Build a button-controlled buzzer (doorbell circuit)",
          "Discuss open vs. closed circuits"
        ]
      },
      {
        "t": "Sensing the environment",
        "guide": "light-sensor",
        "items": [
          "The photoresistor or thermistor as a variable resistor",
          "Build a light-sensing circuit: LED brightness follows the light",
          "Analog vs. digital signals, as a concept"
        ]
      },
      {
        "t": "Combining components",
        "items": [
          "Build a light-activated buzzer alarm (sounds when dark, or the reverse)",
          "Debugging practice: diagnose circuits that do not work"
        ]
      },
      {
        "t": "Final project & showcase",
        "guide": "ece-final",
        "items": [
          "Choose and build: automatic night light or mini alarm system",
          "Present circuit diagrams and demo working builds"
        ]
      }
    ],
    "bonus": [
      {
        "t": "Intro to microcontrollers",
        "guide": "mcu-led",
        "d": "Flash a first program to an ESP32 or RP2040 and blink an LED in code."
      },
      {
        "t": "Sensor to code",
        "d": "Read the photoresistor or thermistor through the microcontroller."
      },
      {
        "t": "Servo control",
        "d": "Turn a potentiometer to set an SG90 servo's angle."
      },
      {
        "t": "Distance-triggered actions",
        "guide": "sensor-servo",
        "d": "An ultrasonic sensor triggers an LED, buzzer or servo, like a parking sensor."
      },
      {
        "t": "Measuring real circuits",
        "d": "Use multimeters to measure voltage, current and resistance in student builds."
      },
      {
        "t": "Capstone upgrade",
        "d": "Rebuild the night light or alarm as a coded, sensor-driven system."
      }
    ]
  },
  "meche": {
    "subject": "Structures & Mechanisms",
    "final": "Low-cost bridge, tower or rescue structure",
    "conceptsShort": "Tension, compression, trusses, optimization",
    "weeks": [
      {
        "t": "Forces in structures",
        "items": [
          "Tension, compression, shear and bending",
          "Bend, pull and squeeze sticks and straws to feel each force",
          "Build a simple free-standing stick structure"
        ]
      },
      {
        "t": "Trusses & load paths",
        "items": [
          "Why triangles hold their shape and squares do not",
          "Build a small popsicle-stick truss",
          "Trace load paths on a diagram"
        ]
      },
      {
        "t": "Bridge challenge",
        "guide": "bridge",
        "items": [
          "Design and build a bridge from sticks, straws and string",
          "Test load-to-weight ratio with washers or pennies",
          "Concept: factor of safety"
        ]
      },
      {
        "t": "Tower challenge",
        "guide": "tower",
        "items": [
          "Tallest self-supporting tower holding a fixed weight (index-card platform + pennies)",
          "Center of mass and base width"
        ]
      },
      {
        "t": "Crane arm challenge",
        "guide": "crane",
        "items": [
          "Cantilevered crane arm (skewers + string) that reaches farthest with a load",
          "Concept: bending moments and counterweights"
        ]
      },
      {
        "t": "Earthquake table challenge",
        "guide": "earthquake",
        "items": [
          "A structure that survives shaking (shake the table or jostle a platform)",
          "Concept: dynamic vs. static loads"
        ]
      },
      {
        "t": "Optimization & final project",
        "guide": "meche-final",
        "items": [
          "Cost constraints: assign points per stick and clip used",
          "Final project: a low-cost bridge, tower or rescue structure with the best strength-to-cost ratio",
          "Present and test structures"
        ]
      }
    ],
    "bonus": [
      {
        "t": "Precision measurement",
        "d": "Measure members with calipers and calculate theoretical strength."
      },
      {
        "t": "Quantified testing",
        "d": "Find exact breaking loads with a force gauge or hanging weights; keep a class leaderboard."
      },
      {
        "t": "Better joints",
        "d": "Swap rubber-band and tape joints for 3D-printed connectors and compare failure points."
      },
      {
        "t": "Speed build with hot glue",
        "d": "A permanent-joint \"max strength\" round against the reusable rubber-band round."
      },
      {
        "t": "Digital scale optimization",
        "d": "Track structure weight against load held to score efficiency."
      },
      {
        "t": "Engineering design competition",
        "d": "An open \"rescue structure\" competition judged on strength, cost and weight."
      }
    ]
  },
  "aero": {
    "subject": "Flight & Flight Mechanics",
    "final": "Rescue glider or cargo-drop system",
    "conceptsShort": "Lift, drag, thrust, stability, iteration",
    "weeks": [
      {
        "t": "Forces of flight",
        "guide": "paper-airplane",
        "items": [
          "Lift, drag, thrust and stability",
          "Build and fly paper airplanes; what makes a good design",
          "Paper airplane challenge for distance and accuracy"
        ]
      },
      {
        "t": "Thrust: balloon rocket",
        "guide": "balloon-rocket",
        "items": [
          "Balloon rocket on a string (straw + string + balloon + tape)",
          "Concept: Newton's third law, thrust",
          "Test and iterate for speed and distance"
        ]
      },
      {
        "t": "Drag & center of mass",
        "guide": "parachute",
        "items": [
          "Build a parachute from paper or index cards + string",
          "Drop challenge: slowest descent, most stable fall",
          "Concept: center of mass vs. center of pressure"
        ]
      },
      {
        "t": "Lift & wing design",
        "guide": "glider-wing",
        "items": [
          "Build a glider with cardboard or foam fins",
          "Concept: lift, stability, dihedral angle",
          "Wing challenge: longest, straightest flight"
        ]
      },
      {
        "t": "Thrust mechanisms",
        "guide": "propeller",
        "items": [
          "Build a propeller car or rubber-band aircraft",
          "Concept: stored energy, thrust-to-weight"
        ]
      },
      {
        "t": "Data collection & iteration",
        "items": [
          "Measure flight distance and time across repeated trials",
          "Revise one earlier design using the data"
        ]
      },
      {
        "t": "Final project & showcase",
        "guide": "aero-final",
        "items": [
          "A rescue glider or cargo drop that lands a paperclip or washer on a target",
          "Present, test and reflect on iterations"
        ]
      }
    ],
    "bonus": [
      {
        "t": "Wind tunnel basics",
        "d": "Use a box fan to watch drag and lift on different shapes."
      },
      {
        "t": "Airfoil comparison",
        "d": "Test 3D-printed airfoils at measured angles to find the best angle of attack."
      },
      {
        "t": "Quantitative flight testing",
        "d": "Record distance and hang time with a stopwatch and measuring tape."
      },
      {
        "t": "Powered flight",
        "d": "Add a mini DC motor and propeller; compare powered and unpowered."
      },
      {
        "t": "Launch consistency",
        "d": "A launch track removes throw-to-throw variation so only the design changes."
      },
      {
        "t": "Capstone data report",
        "d": "Present the cargo glider with a table or graph of each iteration."
      }
    ]
  },
  "bme": {
    "subject": "Biomedical & Environmental",
    "final": "Assistive device or environmental solution",
    "conceptsShort": "Filtration, human-centered design, tradeoffs",
    "weeks": [
      {
        "t": "Intro to filtration",
        "guide": "water-filter",
        "items": [
          "Why clean water matters; how filter layers work",
          "Build a filter: cup + coffee filter + cotton + sand, gravel and carbon",
          "Test it on \"dirty\" water tinted with food coloring"
        ]
      },
      {
        "t": "Contamination & tradeoffs",
        "items": [
          "Compare filters with different layer orders and materials",
          "Tradeoffs: water quality vs. flow speed vs. cost",
          "Concept: contamination sources, filtration efficiency"
        ]
      },
      {
        "t": "Human-centered design",
        "guide": "prosthetic-finger",
        "items": [
          "What makes a good assistive or medical device: comfort, cost, function",
          "Build a low-cost prosthetic finger from cardboard, string and straws"
        ]
      },
      {
        "t": "Biomechanics: hand model",
        "guide": "hand-model",
        "items": [
          "Hand model with straw finger segments and string tendons",
          "Test grip by pulling the strings",
          "Concept: tendons, joints, mechanical advantage"
        ]
      },
      {
        "t": "Assistive devices",
        "guide": "assistive",
        "items": [
          "Design a low-cost pill organizer or assistive grip",
          "Concept: medical device constraints (cost, size, ease of use)"
        ]
      },
      {
        "t": "Environmental testing",
        "items": [
          "Test water samples and filtered output with pH paper and the syringe",
          "Environmental testing standards, as a concept"
        ]
      },
      {
        "t": "Final project & showcase",
        "guide": "bme-final",
        "items": [
          "Design a device that helps a person or solves an environmental problem",
          "Present designs and reasoning"
        ]
      }
    ],
    "bonus": [
      {
        "t": "Quantified filtration",
        "d": "Measure output with graduated cylinders and time it to get flow rate in mL/s."
      },
      {
        "t": "Turbidity testing",
        "d": "Score water clarity before and after with the turbidity chart."
      },
      {
        "t": "Water quality panel",
        "d": "pH-test several safe samples to build a small dataset."
      },
      {
        "t": "Weighing design tradeoffs",
        "d": "Weigh filter media to calculate a cost and weight efficiency score."
      },
      {
        "t": "Plumbing upgrade",
        "d": "Use 3D-printed valve and tube connectors for a reusable fluid system."
      },
      {
        "t": "Capstone data report",
        "d": "Present before and after data: turbidity, pH and flow rate."
      }
    ]
  }
};
