const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement1 = `      const newGuessedIds = [...guessedIds, data.countryId];
      if (!guessedIds.includes(data.countryId)) {
        setGuessedIds(newGuessedIds);
      }

      let newErrorIds = errorIds;
      if (errorIds.includes(data.countryId)) {
        newErrorIds = errorIds.filter(id => id !== data.countryId);
        setErrorIds(newErrorIds);
      }

      const isComplete = data.reachedDestination;
      if (isComplete) {
        setCompleted(true);
        setShowSuccessModal(true);
      }

      saveGameState({
        ...currentState,
        guesses: newGuessedIds,
        errors: newErrorIds,
        completed: isComplete
      });`;

content = content.replace(
  `      const newGuessedIds = [...guessedIds, data.countryId];\n      if (!guessedIds.includes(data.countryId)) {\n        setGuessedIds(newGuessedIds);\n      }\n\n      const isComplete = data.reachedDestination;\n      if (isComplete) {\n        setCompleted(true);\n        setShowSuccessModal(true);\n      }\n\n      saveGameState({\n        ...currentState,\n        guesses: newGuessedIds,\n        completed: isComplete\n      });`,
  replacement1
);


content = content.replace(
  "ignoredIsos={origin ? [origin.id, ...guessedIds, ...errorIds] : [...guessedIds, ...errorIds]}",
  "ignoredIsos={origin ? [origin.id, ...guessedIds, ...errorIds.filter(e => !currentlyBordering.includes(e))] : [...guessedIds, ...errorIds.filter(e => !currentlyBordering.includes(e))]}"
);

fs.writeFileSync(file, content);
