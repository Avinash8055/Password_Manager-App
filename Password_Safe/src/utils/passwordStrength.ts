interface PasswordStrength {
  score: number;
  feedback: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  let feedback = '';

  // Length check
  if (password.length < 8) {
    feedback = 'Password is too short';
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Provide feedback based on score
  if (score === 5) {
    feedback = 'Excellent password!';
  } else if (score === 4) {
    feedback = 'Strong password';
  } else if (score === 3) {
    feedback = 'Moderate password - consider adding more variety';
  } else if (score === 2) {
    feedback = 'Weak password - add numbers and special characters';
  } else {
    feedback = 'Very weak password - use a mix of characters';
  }

  return { score: Math.min(score, 4), feedback };
}