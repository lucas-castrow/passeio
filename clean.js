const fs = require('fs');
try { fs.rmSync('.next', { recursive: true, force: true }); } catch (e) {}
try { fs.rmSync('node_modules', { recursive: true, force: true }); } catch (e) {}
try { fs.rmSync('package-lock.json', { force: true }); } catch (e) {}
