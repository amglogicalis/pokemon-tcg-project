const fs = require('fs');
const path = require('path');

const directory = __dirname; // Raíz del proyecto

console.log("🧹 Buscando backups de expansiones (.zip)...");

fs.readdir(directory, (err, files) => {
    if (err) throw err;

    const backups = files.filter(file => file.startsWith('backup_') && file.endsWith('.zip'));

    if (backups.length === 0) {
        console.log("✅ La carpeta está limpia. No hay backups que borrar.");
        return;
    }

    backups.forEach(file => {
        const filePath = path.join(directory, file);
        try {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Eliminado: ${file}`);
        } catch (e) {
            console.error(`❌ No se pudo borrar ${file}`);
        }
    });

    console.log(`\n✨ Limpieza completada. (${backups.length} archivos eliminados)`);
});
