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