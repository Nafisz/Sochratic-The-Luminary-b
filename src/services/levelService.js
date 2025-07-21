// services/levelService.js
const BASE_EXP = 500;
const STEP_EXP = 300;

function expToLevel(totalExp) {
  let level = 1;
  let required = BASE_EXP;
  while (totalExp >= required) {
    totalExp -= required;
    level += 1;
    required += STEP_EXP;
  }
  return level;
}

function levelToExp(level) {
  let exp = 0;
  for (let l = 1; l < level; l++) {
    exp += BASE_EXP + (l - 1) * STEP_EXP;
  }
  return exp;
}

module.exports = { expToLevel, levelToExp };