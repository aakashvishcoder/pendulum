import numpy as np
import pygame
import sys
from scipy.integrate import solve_ivp

pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Double Pendulum")
clock = pygame.time.Clock()
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)

g = 9.81
L1 = 150
L2 = 120
m1 = 10
m2 = 10

y0 = [np.pi / 2, 0, np.pi / 2, 0]

t_span = (0, 100)
t_eval = np.linspace(0, 100, 5000)

def double_pendulum(t, y):
    theta_1, w1, theta_2, w2 = y
    delta_theta = theta_1 - theta_2
    denominator_1 = (2 * m1 + m2 - m2 * np.cos(2 * delta_theta))
    denominator_2 = (2 * m1 + m2 - m2 * np.cos(2 * delta_theta))
    
    dw1 = (-g * (2 * m1 + m2) * np.sin(theta_1) - m2 * g * np.sin(theta_1 - 2 * theta_2) - 
        2 * np.sin(delta_theta) * m2 * (w2**2 * L2 + w1**2 * L1 * np.cos(delta_theta))) / (L1 * denominator_1)
    dw2 = (2 * np.sin(delta_theta) * (w1**2 * L1 * (m1 + m2) + 
            g * (m1 + m2) * np.cos(theta_1) + w2**2 * L2 * m2 * np.cos(delta_theta))) / (L2 * denominator_2)
    
    return [w1, dw1, w2, dw2]

sol = solve_ivp(double_pendulum, t_span, y0, t_eval=t_eval, method="RK45", rtol=1e-8, atol=1e-8)

theta_1_vals = sol.y[0]
theta_2_vals = sol.y[2]

def polar_to_cartesian(theta_1, theta_2):
    x1 = L1 * np.sin(theta_1)
    y1 = L1 * np.cos(theta_1)
    x2 = x1 + L2 * np.sin(theta_2)
    y2 = y1 + L2 * np.cos(theta_2)
    return (x1, y1, x2, y2)

def to_screen(x, y):
    scale = 1
    offset_x, offset_y = WIDTH // 2, HEIGHT // 4
    return int(offset_x + scale * x), int(offset_y + scale * y)

trail = []

running = True
frame = 0
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False 
            
    screen.fill(BLACK)
    
    if frame < len(theta_1_vals):
        theta_1 = theta_1_vals[frame]
        theta_2 = theta_2_vals[frame]
        x1, y1, x2, y2 = polar_to_cartesian(theta_1, theta_2)
        
        p1 = to_screen(x1, y1)
        p2 = to_screen(x2, y2)
        origin = to_screen(0, 0)
        
        pygame.draw.line(screen, WHITE, origin, p1, 2)
        pygame.draw.line(screen, WHITE, p1, p2, 2)
        
        pygame.draw.circle(screen, RED, origin, 5)
        pygame.draw.circle(screen, BLUE, p1, int(m1))
        pygame.draw.circle(screen, GREEN, p2, int(m2))
        
        trail.append(p2)
        if len(trail) > 500:
            trail.pop(0)
        for i in range(1, len(trail)):
            alpha = int(255 * i / len(trail))
            color = (0, 255, 0, alpha)
            pygame.draw.line(screen, GREEN, trail[i-1], trail[i], 2)
        
        frame += 1
    else: 
        frame = 0
        trail.clear()
    
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()