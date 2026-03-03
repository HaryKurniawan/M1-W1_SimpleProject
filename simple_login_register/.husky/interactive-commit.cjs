const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const types = [
    { name: 'feat', desc: 'Fitur baru' },
    { name: 'fix', desc: 'Perbaikan bug' },
    { name: 'update', desc: 'Update/perubahan' },
    { name: 'docs', desc: 'Dokumentasi' },
    { name: 'style', desc: 'Formatting' },
    { name: 'refactor', desc: 'Refactoring kode' },
    { name: 'test', desc: 'Menambah test' },
    { name: 'chore', desc: 'Maintenance' },
    { name: 'perf', desc: 'Perbaikan performa' },
    { name: 'ci', desc: 'CI/CD changes' },
    { name: 'build', desc: 'Build system' },
    { name: 'revert', desc: 'Revert commit' }
];

async function ask(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('\n===============================================');
    console.log('  📝 Interactive Commit (Node.js)');
    console.log('===============================================\n');

    console.log('📋 Pilih tipe commit:');
    types.forEach((t, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}) ${t.name.padEnd(10)} - ${t.desc}`);
    });

    let choice = 0;
    while (choice < 1 || choice > types.length) {
        const res = await ask(`\nPilih nomor [1-${types.length}]: `);
        choice = parseInt(res);
    }

    const selectedType = types[choice - 1].name;
    const scope = await ask('Scope (opsional, tekan Enter untuk skip): ');
    const description = await ask('Deskripsi commit: ');

    if (!description) {
        console.log('⚠️  Deskripsi tidak boleh kosong!');
        process.exit(1);
    }

    const commitMsg = scope ? `${selectedType}(${scope}): ${description}` : `${selectedType}: ${description}`;

    console.log('\n-----------------------------------------------');
    console.log(`  ✅ Commit message: ${commitMsg}`);
    console.log('-----------------------------------------------\n');

    const confirm = await ask('Lanjutkan commit? [Y/n]: ');
    if (confirm.toLowerCase() === 'n') {
        console.log('❌ Commit dibatalkan.');
        process.exit(0);
    }

    try {
        execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
        console.log('\n🎉 Done!');
    } catch (e) {
        process.exit(1);
    }

    rl.close();
}

main();
