// A short "what this step is doing and why" note for every build step, keyed "kit/build",
// one entry per written step in order. Merged into each project as `details` in kits.mjs.
// Written for the site; worth a read-through by the club before classroom use.
export const stepDetails = {
  "ece/led-circuit": [
    "An LED is a diode: current only flows through it one way. The longer leg (the anode) must face the positive side of the battery, so finding it first saves a lot of \"why won't it light\" later.",
    "Each row of five holes on a breadboard is joined underneath by a metal strip. Putting the legs in different rows keeps them from being shorted together.",
    "The resistor limits how much current can flow. Without it the LED would take too much current and burn out in seconds.",
    "This connects the positive side of the battery to the start of the circuit: battery, then resistor, then LED.",
    "This closes the loop back to the battery. Electricity needs a complete path from + all the way back to −.",
    "If the LED stays dark, the usual causes are a backwards LED or a leg that is not pushed fully into the board. Checking both teaches the habit of debugging one thing at a time."
  ],
  "ece/button-buzzer": [
    "The gap down the middle of the breadboard separates the two halves. Straddling it puts the button's legs in separate rows so the button can actually open and close the circuit.",
    "Many buzzers only sound when connected the right way round, just like an LED. Noting the + leg now avoids a silent circuit.",
    "Power from the battery now waits at the button. Nothing happens until the button is pressed.",
    "Pressing the button connects this wire to the battery, so current can flow on into the buzzer.",
    "This returns the current to the battery and completes the loop, but only while the button is held down.",
    "This is the test: sound only while pressed. If it buzzes all the time, the button is turned so its legs are always connected."
  ],
  "ece/light-sensor": [
    "Starting from a circuit you know works means any new problem must come from the part you are about to add.",
    "Removing this wire opens a gap in the circuit, which is exactly where the sensor will go.",
    "The photoresistor now controls how much current reaches the LED. Unlike an LED, it works either way round.",
    "Bright light lowers the photoresistor's resistance, so more current flows and the LED glows brighter.",
    "Covering the sensor raises its resistance, so less current flows and the LED dims.",
    "Writing down what you saw turns a cool trick into an observation you can explain: resistance changes with light."
  ],
  "ece/mcu-led": [
    "This is the same LED circuit as before, but powered from pin 9 instead of the battery, so code can switch it on and off.",
    "A wrong connection here can damage the board or the USB port. A quick check before plugging in is what real engineers do too.",
    "The editor needs to know which board you are using and which USB port it is on, or the upload will fail.",
    "Uploading copies your program onto the microcontroller. It now runs on its own and repeats the loop forever.",
    "Predicting before testing is the point: smaller delay values mean shorter waits, so the LED should blink faster."
  ],
  "ece/sensor-servo": [
    "The servo and sensor both need 5V and ground. Running them to two shared columns keeps the wiring tidy and easy to check.",
    "The servo has three wires: power, ground, and a signal wire that tells it what angle to turn to.",
    "TRIG tells the sensor to send a pulse of sound and ECHO reports when the echo comes back. The board times the gap to work out distance.",
    "A flag makes a small movement easy to see from across the room.",
    "The sketch reads the distance about ten times a second and decides whether to lift or lower the arm.",
    "This is the full input, decision, output loop: your hand is the input, the code decides, and the servo acts.",
    "Changing one number and retesting shows how a single setting changes how a device behaves."
  ],
  "ece/ece-final": [
    "Choosing a real use first keeps the project focused on solving a problem rather than adding parts.",
    "One sentence about who it is for and what it does becomes the test for whether the project worked.",
    "Every smart device can be described this way. Filling in the blanks is the design before any wiring starts.",
    "The 10kΩ resistor and the photoresistor form a voltage divider, so the analog pin reads a number that rises and falls with the light.",
    "Same code pattern, different parts: a different sensor as the input and the buzzer as the output.",
    "Designing for someone else means thinking about how they will press, see or hear it.",
    "Testing with another group finds problems you no longer notice in your own design.",
    "Explaining the input, decision and output shows you understand why it works, not just that it works."
  ],
  "meche/bridge": [
    "A fixed gap means every team solves the same problem, so the results can be compared fairly.",
    "Triangles cannot change shape without a stick changing length, which is why a row of them (a truss) is so strong for its weight.",
    "Building both sides flat on the table makes them identical, so the load is shared evenly.",
    "Cross-pieces stop the two trusses from leaning or twisting when weight is added.",
    "The deck spreads the load into both trusses instead of pushing on a single stick.",
    "Weighing the bridge first is needed for the score. A strong bridge is only impressive if it is also light.",
    "Adding weight slowly shows exactly how much it held before failing, and which piece failed first.",
    "Dividing load by mass rewards clever design over simply using more sticks."
  ],
  "meche/tower": [
    "The same weight and time limit for everyone makes this a fair engineering competition.",
    "A wide, braced base stops the tower from tipping. Most towers fail at the bottom first.",
    "Narrowing as you go up keeps the center of mass low and over the base, like a real skyscraper.",
    "An unbraced rectangle folds into a parallelogram. A diagonal turns it into two triangles that hold their shape.",
    "The platform spreads the weight across the top so it does not crush a single straw.",
    "Height only counts if the tower can do its job: hold the weight for the full ten seconds."
  ],
  "meche/crane": [
    "The arm must be anchored firmly, or it will tip off the desk instead of testing the arm's strength.",
    "A cantilever bends most where it meets the desk, so it needs to be widest there and can be thin at the tip.",
    "The mast gives the cable a high point to pull from, which takes much of the bending load off the arm.",
    "String is strong when pulled and almost weightless, so it carries tension perfectly from mast to tip.",
    "A hook at the tip puts the load at the hardest place to support, the farthest point from the desk.",
    "Measuring before loading records the reach, the first half of the score."
  ],
  "meche/earthquake": [
    "Marbles let the tray slide side to side, a simple model of the ground moving in an earthquake.",
    "Taping the feet down means the building moves with the ground, the way a real foundation does.",
    "Weight at the top makes the shaking much harder to survive, just as heavy upper floors do in real buildings.",
    "Shaking every structure the same way keeps the test fair, so differences come from the designs.",
    "Where it bends first shows where the structure is weakest.",
    "Fixing only the weak spot and retesting is how engineers improve designs: one change at a time."
  ],
  "meche/meche-final": [
    "A real scenario gives the structure a purpose, which decides what \"good\" means.",
    "Requirements are the measurable goals. They turn \"make a good bridge\" into something you can test.",
    "Two sketches force you to compare ideas instead of building the first one you thought of.",
    "Explaining your choice in a sentence shows you made a decision, not a guess.",
    "Weighing the finished structure records how much material you actually used.",
    "Testing past the required load finds out how much margin the design really has.",
    "Factor of safety says how many times stronger the structure is than it needs to be.",
    "Engineers always present the trade-offs: what you gained, what it cost, and what you would change."
  ],
  "aero/paper-airplane": [
    "A simple standard dart is the baseline. Every later change is compared against it.",
    "Throwing three times evens out the luck in any single throw.",
    "The average is a fairer number to compare than your best throw.",
    "Changing only one thing means you will know exactly what caused any difference.",
    "Testing the new version the same way keeps the comparison fair.",
    "Keeping only what works is how a design improves step by step.",
    "Several rounds of small changes usually beat one big redesign. This is iteration."
  ],
  "aero/balloon-rocket": [
    "The straw is the rocket's guide. It will slide along the string, keeping the flight straight.",
    "A tight, level string gives every launch the same track, so speed is the only thing that changes.",
    "Clipping instead of tying lets you refill the balloon and launch it again.",
    "The nozzle must point backwards: air rushing out the back pushes the balloon forward.",
    "Starting the stopwatch at release means you are timing only the flight.",
    "Distance and time together give you speed, the real measure of thrust.",
    "Less air means less thrust for a shorter time, so you can see how fuel affects performance."
  ],
  "aero/parachute": [
    "The canopy catches air as it falls. A bigger canopy creates more drag.",
    "Equal strings keep the canopy level so it does not tip and spill air.",
    "Hanging the payload below the canopy keeps the center of mass low, which makes it stable.",
    "A fixed height makes every drop comparable.",
    "Averaging three drops evens out wobbles and timing mistakes.",
    "A small vent lets air escape evenly, so the parachute stops swinging and falls straighter."
  ],
  "aero/glider-wing": [
    "The main wing makes the lift. Its size and shape matter most.",
    "The tail keeps the glider pointing forward, like the feathers on an arrow.",
    "Placing the wing about a third of the way back puts lift near the balance point.",
    "Nose weight moves the center of mass forward, which stops the glider from stalling and dropping.",
    "A glider is stable when it balances just ahead of where the wing makes lift. Adjusting nose weight sets that balance.",
    "A gentle, level launch tests the glider rather than the strength of the throw.",
    "Comparing changes shows which wing design gives the longest, smoothest glide."
  ],
  "aero/propeller": [
    "A light frame means more of the stored energy goes into moving the vehicle.",
    "The propeller must spin freely. Friction here wastes energy.",
    "The rear hook anchors the rubber band, the vehicle's energy store.",
    "Stretching the band between the hooks lets the propeller twist it to store energy.",
    "Wheels or wings decide whether the thrust drives the vehicle along the ground or through the air.",
    "Winding twists energy into the rubber band. Letting go turns it into thrust.",
    "Doubling the turns tests whether double the stored energy gives double the distance."
  ],
  "aero/aero-final": [
    "Choosing the mission decides what kind of design you need: gliding or dropping.",
    "Clear requirements make it possible to say whether the mission succeeded.",
    "Marking the center of mass on the sketch is how you plan a stable flight before building.",
    "A quick first version finds the real problems sooner than careful planning alone.",
    "Recording every flight turns guesses into data you can use.",
    "One change per test means you know which change made it better.",
    "Three scored attempts show whether the design works reliably, not just once."
  ],
  "bme/water-filter": [
    "Small holes let water through but hold the filter layers in place.",
    "The coffee filter and cotton catch the finest bits and stop sand washing out of the bottom.",
    "Each layer traps smaller particles: gravel catches debris, sand catches grit, and carbon absorbs colour.",
    "The second cup catches the filtered water so you can measure it.",
    "Noting how dirty the water is before filtering gives you something to compare against.",
    "Pouring slowly avoids disturbing the layers. Timing starts now to measure flow rate.",
    "Volume divided by time is the flow rate: how fast the filter cleans water.",
    "Clarity and pH show how well the filter worked. The trade-off is that cleaner usually means slower."
  ],
  "bme/prosthetic-finger": [
    "Scored folds act like knuckle joints, so the strip bends only where a finger would.",
    "The straw pieces guide the string, just as tissue guides the tendons in your hand.",
    "This string is the tendon. Pulling it will bend every joint.",
    "Anchoring the tendon at the tip is what makes the whole finger curl when it is pulled.",
    "Real fingers have tendons on the back that straighten them. The rubber band does that job here.",
    "Pull to curl, release to straighten: the same motion your own finger makes."
  ],
  "bme/hand-model": [
    "Tracing your own hand gives the model real proportions.",
    "Folding at your own knuckle positions makes the fingers bend in the right places.",
    "Straw guides keep each tendon in line so it pulls the finger straight.",
    "Each finger needs its own tendon so it can move on its own.",
    "Anchoring at the fingertip makes the whole finger curl when its string is pulled.",
    "Loops at the wrist give you something to pull, like the muscles in your forearm.",
    "Pulling strings one at a time, then together, shows how separate tendons combine into a grip."
  ],
  "bme/assistive": [
    "Medical design starts with a real person and the task they find hard.",
    "Writing needs as short statements turns them into goals you can test.",
    "Sketching two ideas avoids falling for the first one.",
    "Big labels and lids that are easy to open are what make this organizer usable for its person.",
    "A thicker, softer, non-slip grip is easier to hold with weak or painful hands.",
    "Thick gloves simulate reduced dexterity, so you can see how your design really performs.",
    "Changing one thing based on the test is how assistive devices are improved for real users."
  ],
  "bme/bme-final": [
    "Picking a direction focuses the project on either a person or the environment.",
    "Describing the need clearly is the most important step in biomedical design.",
    "Constraints like cost and safety rule out ideas early, before time is spent building them.",
    "Deciding how to measure success before building keeps the test honest.",
    "A first prototype from kit materials is quick to make and quick to learn from.",
    "Testing, recording and improving at least once is the engineering design loop.",
    "Presenting the trade-offs shows you understood the problem, not just the build."
  ]
};
