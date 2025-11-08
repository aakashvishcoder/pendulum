export interface Link {
    length: number;
    mass: number;
    angle: number;
    angularVelocity: number;
}

export interface Energy {
    kinetic: number;
    potential: number;
    workDrag: number;
}

const g = 9.81; //gravity!!!
const dt = 0.016; //FPS

export function createDefaultPendulum(n: number = 2): Link[] {
  return Array(n).fill(0).map((_, i) => ({
    length: 100 - i * 10,
    mass: 10,
    angle: Math.PI / 2 + (i * 0.2),
    angularVelocity: 0
  }));
}

export function updatePendulum(links: Link[], useDrag: boolean, dragCoeff: number = 0.005): { links: Link[]; energy: Energy } {
  //position and velocity computations
  const positions = [];
  const velocities = [];
  let x = 0, y = 0;
  let vx = 0, vy = 0;

  for (let i = 0; i < links.length; i++) {
    const θ = links[i].angle;
    const ω = links[i].angularVelocity;
    x += links[i].length * Math.sin(θ);
    y += links[i].length * Math.cos(θ);
    //using approximations for velocity
    vx += links[i].length * ω * Math.cos(θ);
    vy += -links[i].length * ω * Math.sin(θ);
    positions.push({ x, y });
    velocities.push({ vx, vy });
  }

  //computing the forces and updating
  const newLinks = [...links];
  let workDrag = 0;

  // Update from last link to first (or use RK4 per link — simplified Euler here for speed)
  for (let i = 0; i < links.length; i++) {
    const θ = links[i].angle;
    let torque = -g * links[i].mass * links[i].length * Math.sin(θ);

    //coupling
    if (i > 0) {
      const parentAccel = (i === 1) ? -g : 0;
      torque += parentAccel * links[i].mass * links[i].length * Math.sin(θ - links[i-1].angle);
    }

    const I = links[i].mass * links[i].length ** 2; //moment of inertia
    let α = torque / I; //angular acceleration (N2LR)

    if (useDrag) {
      const dragTorque = -dragCoeff * links[i].angularVelocity;
      α += dragTorque / I;
      //work done by drag as an integral 
      workDrag += dragTorque * (links[i].angularVelocity * dt);
    }

    newLinks[i] = {
      ...links[i],
      angularVelocity: links[i].angularVelocity + α * dt,
      angle: links[i].angle + links[i].angularVelocity * dt
    };
  }

  //calculate the energy
  let KE = 0;
  let PE = 0;
  x = 0; y = 0;
  for (let i = 0; i < newLinks.length; i++) {
    x += newLinks[i].length * Math.sin(newLinks[i].angle);
    y += newLinks[i].length * Math.cos(newLinks[i].angle);
    const v = Math.hypot(
      velocities[i]?.vx || 0,
      velocities[i]?.vy || 0
    );
    KE += 0.5 * newLinks[i].mass * v * v;
    PE += newLinks[i].mass * g * y;
  }

  return {
    links: newLinks,
    energy: {
      kinetic: KE,
      potential: -PE, // since y=0 is top, lower y → more negative PE
      workDrag: workDrag
    }
  };
}