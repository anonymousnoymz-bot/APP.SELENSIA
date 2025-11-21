// Data penyimpanan di LocalStorage. Mengambil data yang sudah ada atau array kosong.
let suratMasuk = JSON.parse(localStorage.getItem('suratMasuk')) || [];
let suratKeluar = JSON.parse(localStorage.getItem('suratKeluar')) || [];

// --- Bagian I: Fungsi Inti Aplikasi ---

/**
 * Menyimpan data ke LocalStorage dan memperbarui tampilan UI (Statistik & Tabel).
 */
function updateDataAndUI() {
    // 1. Simpan ke LocalStorage
    localStorage.setItem('suratMasuk', JSON.stringify(suratMasuk));
    localStorage.setItem('suratKeluar', JSON.stringify(suratKeluar));
    
    // 2. Perbarui Tampilan (Statistik)
    updateStats();
    
    // 3. Perbarui Opsi Filter (asal surat saja)
    populateFilterAsalOptions();

    // 4. Perbarui Tampilan Tabel (render masing-masing)
    filterSurat('masuk'); 
    filterSurat('keluar');
}

/**
 * Mengisi opsi dropdown filter 'Asal Surat' secara dinamis (khusus untuk surat masuk).
 */
function populateFilterAsalOptions() {
    const filterAsalSelect = document.getElementById('filter-asal-masuk');
    
    if (!filterAsalSelect) return; 

    const currentSelectedValue = filterAsalSelect.value; 

    const inputAsalSelect = document.getElementById('asal-surat');
    let uniqueAsalOptions = new Set();

    if (inputAsalSelect) {
        // Ambil opsi dari daftar statis di HTML untuk input-masuk
        Array.from(inputAsalSelect.options).forEach(option => {
            if (option.value && option.value !== "-- Pilih Asal Surat --") {
                uniqueAsalOptions.add(option.value);
            }
        });
    }

    // Tambahkan asal surat dari data yang sudah tersimpan (untuk memastikan semua opsi ada)
    suratMasuk.map(surat => surat.asal).forEach(asal => {
        if (asal && asal !== "Lainnya") { // "Lainnya" tidak perlu menjadi opsi filter utama
            uniqueAsalOptions.add(asal);
        }
    });

    const sortedUniqueAsal = Array.from(uniqueAsalOptions).sort();

    // Kosongkan dan isi ulang filter
    filterAsalSelect.innerHTML = '<option value="">-- Semua Asal Surat --</option>';

    sortedUniqueAsal.forEach(asal => {
        const option = document.createElement('option');
        option.value = asal;
        option.textContent = asal;
        filterAsalSelect.appendChild(option);
    });

    // Pertahankan nilai yang terpilih jika masih ada
    if (currentSelectedValue && filterAsalSelect.querySelector(`option[value="${currentSelectedValue}"]`)) {
        filterAsalSelect.value = currentSelectedValue;
    } else {
        filterAsalSelect.value = ''; 
    }
}

/**
 * Memperbarui angka statistik di dashboard.
 */
function updateStats() {
    const countMasukEl = document.getElementById('count-masuk');
    const countKeluarEl = document.getElementById('count-keluar');
    const badgeMasukEl = document.getElementById('badge-masuk');
    const badgeKeluarEl = document.getElementById('badge-keluar');

    if (countMasukEl) countMasukEl.textContent = suratMasuk.length;
    if (countKeluarEl) countKeluarEl.textContent = suratKeluar.length;
    if (badgeMasukEl) badgeMasukEl.textContent = suratMasuk.length;
    if (badgeKeluarEl) badgeKeluarEl.textContent = suratKeluar.length;
}

/**
 * Fungsi umum untuk memfilter dan me-render tabel surat.
 * @param {string} type - 'masuk' atau 'keluar'
 */
function filterSurat(type) {
    const tableBody = document.querySelector(`#tabel-${type} tbody`);
    if (!tableBody) return;

    const data = type === 'masuk' ? suratMasuk : suratKeluar;
    const searchTermInput = document.getElementById(`search-input-${type}`);
    const filterAsalSelect = document.getElementById('filter-asal-masuk'); 
    const filterBulanTahunInput = document.getElementById(`filter-bulan-tahun-${type}`);

    const searchTerm = searchTermInput ? searchTermInput.value.toLowerCase() : '';
    const filterAsal = type === 'masuk' && filterAsalSelect ? filterAsalSelect.value.toLowerCase() : '';
    const filterBulanTahun = filterBulanTahunInput ? filterBulanTahunInput.value.toLowerCase() : '';

    const filteredData = data.filter(surat => {
        const matchesSearchTerm = (
            surat.no.toLowerCase().includes(searchTerm) ||
            surat.perihal.toLowerCase().includes(searchTerm) ||
            (type === 'masuk' && surat.asal.toLowerCase().includes(searchTerm)) ||
            (type === 'keluar' && surat.tujuan.toLowerCase().includes(searchTerm))
        );

        const matchesAsal = type === 'masuk' 
            ? (filterAsal === '' || surat.asal.toLowerCase() === filterAsal || (filterAsal === 'lainnya' && surat.asal === 'Lainnya'))
            : true;

        const dateToFilter = type === 'masuk' ? surat.tanggalSurat : surat.tanggalKeluar; 
        const matchesBulanTahun = filterBulanTahun === '' || 
            (dateToFilter && formatDateForFilter(dateToFilter).includes(filterBulanTahun));

        return matchesSearchTerm && matchesAsal && matchesBulanTahun;
    });

    renderTable(type, filteredData);
}

/**
 * Mengisi tabel HTML dengan data surat yang difilter.
 * @param {string} type - 'masuk' atau 'keluar'
 * @param {Array} dataToRender - Array data surat yang sudah difilter.
 */
function renderTable(type, dataToRender) {
    const tableBody = document.querySelector(`#tabel-${type} tbody`);
    const tableHead = document.querySelector(`#tabel-${type} thead tr`); 
    if (!tableBody || !tableHead) return;

    tableBody.innerHTML = ''; 

    let colSpanCount; 

    // Lengkapi header tabel keluar jika kosong (seperti pada HTML yang diberikan)
    if (type === 'keluar' && tableHead.children.length === 0) {
        tableHead.innerHTML = `
            <th>No</th>
            <th>Tanggal Kirim Surat</th>
            <th>Nomor Surat</th>
            <th>Tanggal Keluar</th>
            <th>Sifat Surat</th>
            <th>Perihal</th>
            <th>Tujuan Surat</th>
            <th>Gambar</th>
            <th>Aksi</th>
        `;
    }

    if (type === 'masuk') {
        colSpanCount = 9; 
    } else { // type === 'keluar'
        colSpanCount = 9; 
    }

    if (dataToRender.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = colSpanCount; 
        cell.textContent = `Tidak ada data surat ${type} yang ditemukan.`;
        cell.style.textAlign = 'center';
        return;
    }

    dataToRender.forEach((surat, index) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = index + 1; // Nomor urut
        
        if (type === 'masuk') {
            row.insertCell(1).textContent = formatDate(surat.tanggalTerima); 
            row.insertCell(2).textContent = surat.no; 
            row.insertCell(3).textContent = formatDate(surat.tanggalSurat); 
            row.insertCell(4).textContent = surat.sifat; 
            row.insertCell(5).textContent = surat.perihal; 
            row.insertCell(6).textContent = surat.asal; 
            
            const imgCell = row.insertCell(7);
            if (surat.gambar) {
                const img = document.createElement('img');
                img.src = surat.gambar;
                img.alt = 'Gambar Surat';
                img.style.maxWidth = '50px';
                img.style.maxHeight = '50px';
                imgCell.appendChild(img);
            } else {
                imgCell.textContent = '-';
            }

            const actionCell = row.insertCell(8); 
            actionCell.className = 'action-cell';
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.className = 'btn danger-btn btn-small';
            deleteButton.onclick = () => deleteSurat(type, surat.id);
            actionCell.appendChild(deleteButton);

        } else { // type === 'keluar'
            row.insertCell(1).textContent = formatDate(surat.tanggalKirim); 
            row.insertCell(2).textContent = surat.no;
            row.insertCell(3).textContent = formatDate(surat.tanggalKeluar); 
            row.insertCell(4).textContent = surat.sifat;
            row.insertCell(5).textContent = surat.perihal;
            row.insertCell(6).textContent = surat.tujuan;
            
            const imgCell = row.insertCell(7);
            if (surat.gambar) {
                const img = document.createElement('img');
                img.src = surat.gambar;
                img.alt = 'Gambar Surat';
                img.style.maxWidth = '50px';
                img.style.maxHeight = '50px';
                imgCell.appendChild(img);
            } else {
                imgCell.textContent = '-';
            }

            const actionCell = row.insertCell(8); 
            actionCell.className = 'action-cell';
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.className = 'btn danger-btn btn-small';
            deleteButton.onclick = () => deleteSurat(type, surat.id);
            actionCell.appendChild(deleteButton);
        }
    });
}

/**
 * Menghapus surat dari array dan LocalStorage.
 * @param {string} type - 'masuk' atau 'keluar'
 * @param {string} id - ID unik surat yang akan dihapus.
 */
function deleteSurat(type, id) {
    if (confirm(`Apakah Anda yakin ingin menghapus surat ${id} ini?`)) {
        if (type === 'masuk') {
            suratMasuk = suratMasuk.filter(surat => surat.id !== id);
        } else {
            suratKeluar = suratKeluar.filter(surat => surat.id !== id);
        }
        updateDataAndUI(); 
    }
}

/**
 * Mengubah format tanggal dari YYYY-MM-DD menjadi DD-MM-YYYY.
 * @param {string} dateString - Tanggal dalam format YYYY-MM-DD.
 * @returns {string} Tanggal dalam format DD-MM-YYYY.
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}

/**
 * Mengubah format tanggal untuk filter bulan/tahun.
 * @param {string} dateString - Tanggal dalam format YYYY-MM-DD.
 * @returns {string} Tanggal dalam format "NamaBulan YYYY" atau "YYYY".
 */
function formatDateForFilter(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); 
    if (isNaN(date.getTime())) return ''; 
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('id-ID', options).toLowerCase();
}

/**
 * Menyiapkan dan mencetak tabel surat.
 * @param {string} type - 'masuk' atau 'keluar'
 */


// --- Bagian II: Event Listeners & Inisialisasi ---

document.addEventListener('DOMContentLoaded', () => {
    // Navigasi Sidebar
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active-nav'));
            button.classList.add('active-nav');

            const targetId = button.dataset.target;

            contentSections.forEach(section => section.classList.add('hidden-section'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden-section');
            }
            updateDataAndUI();
        });
    });

    updateDataAndUI();
    const initialActiveSection = document.querySelector('.content-section.active-section');
    if (initialActiveSection) {
        initialActiveSection.classList.remove('hidden-section');
    }
    
    // --- Form Surat Masuk ---
    const formMasuk = document.getElementById('form-masuk');
    const asalSuratSelect = document.getElementById('asal-surat');
    const asalSuratLainnyaInput = document.getElementById('asal-surat-lainnya');
    const gambarSuratMasukInput = document.getElementById('gambar-surat-masuk');
    const previewGambarMasuk = document.getElementById('preview-gambar-masuk');

    if (asalSuratSelect && asalSuratLainnyaInput) {
        asalSuratSelect.addEventListener('change', () => {
            if (asalSuratSelect.value === 'Lainnya') {
                asalSuratLainnyaInput.style.display = 'block';
                asalSuratLainnyaInput.setAttribute('required', 'true');
            } else {
                asalSuratLainnyaInput.style.display = 'none';
                asalSuratLainnyaInput.removeAttribute('required');
                asalSuratLainnyaInput.value = ''; 
            }
        });
    }

    if (gambarSuratMasukInput && previewGambarMasuk) {
        gambarSuratMasukInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewGambarMasuk.src = e.target.result;
                    previewGambarMasuk.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewGambarMasuk.src = '';
                previewGambarMasuk.style.display = 'none';
            }
        });
    }

    if (formMasuk) {
        formMasuk.addEventListener('submit', (e) => {
            e.preventDefault(); 

            // Mengambil elemen-elemen date dari form-masuk secara berurutan
            const tglMasukElements = formMasuk.querySelectorAll('input[type="date"]');
            const tanggalPenerimaSurat = tglMasukElements[0] ? tglMasukElements[0].value : ''; // Elemen date pertama
            const tanggalSurat = tglMasukElements[1] ? tglMasukElements[1].value : '';         // Elemen date kedua

            const asal = asalSuratSelect.value === 'Lainnya' ? asalSuratLainnyaInput.value : asalSuratSelect.value;
            if (asal.trim() === '') {
                alert('Asal Surat tidak boleh kosong.');
                return;
            }

            const newSurat = {
                id: 'SM-' + Date.now(), 
                tanggalTerima: tanggalPenerimaSurat, 
                no: document.getElementById('no-masuk').value,
                tanggalSurat: tanggalSurat,         
                sifat: document.getElementById('sifat-surat-masuk').value,
                perihal: document.getElementById('perihal-masuk').value,
                asal: asal,
                gambar: previewGambarMasuk.src 
            };
            suratMasuk.push(newSurat);
            updateDataAndUI(); 

            formMasuk.reset();
            if (asalSuratLainnyaInput) {
                asalSuratLainnyaInput.style.display = 'none';
                asalSuratLainnyaInput.value = '';
            }
            if (previewGambarMasuk) {
                previewGambarMasuk.src = '';
                previewGambarMasuk.style.display = 'none';
            }
            alert('Surat Masuk Berhasil Disimpan!');
        });
    }

    // --- Form Surat Keluar ---
    const formKeluar = document.getElementById('form-keluar');
    const gambarSuratKeluarInput = document.getElementById('gambar-surat-keluar');
    const previewGambarKeluar = document.getElementById('preview-gambar-keluar');

    if (gambarSuratKeluarInput && previewGambarKeluar) {
        gambarSuratKeluarInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewGambarKeluar.src = e.target.result;
                    previewGambarKeluar.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewGambarKeluar.src = '';
                previewGambarKeluar.style.display = 'none';
            }
        });
    }

    if (formKeluar) {
        formKeluar.addEventListener('submit', (e) => {
            e.preventDefault(); 

            // Mengambil elemen-elemen date dari form-keluar secara berurutan
            const tglKeluarElements = formKeluar.querySelectorAll('input[type="date"]');
            const tanggalKirimSurat = tglKeluarElements[0] ? tglKeluarElements[0].value : ''; // Elemen date pertama
            const tanggalKeluar = tglKeluarElements[1] ? tglKeluarElements[1].value : '';         // Elemen date kedua

            const newSurat = {
                id: 'SK-' + Date.now(), 
                tanggalKirim: tanggalKirimSurat, 
                no: document.getElementById('no-keluar').value,
                tanggalKeluar: tanggalKeluar, 
                sifat: document.getElementById('sifat-surat-keluar').value,
                perihal: document.getElementById('perihal-keluar').value,
                tujuan: document.getElementById('tujuan-surat').value,
                gambar: previewGambarKeluar.src
            };
            suratKeluar.push(newSurat);
            updateDataAndUI(); 

            formKeluar.reset();
            if (previewGambarKeluar) {
                previewGambarKeluar.src = '';
                previewGambarKeluar.style.display = 'none';
            }
            alert('Surat Keluar Berhasil Disimpan!');
        });
    }

    // Event listener untuk filter (asal surat masuk)
    const filterAsalMasuk = document.getElementById('filter-asal-masuk');
    if (filterAsalMasuk) {
        filterAsalMasuk.addEventListener('change', () => filterSurat('masuk'));
    }

    // Event listener untuk filter (search input surat masuk)
    const searchInputMasuk = document.getElementById('search-input-masuk');
    if (searchInputMasuk) {
        searchInputMasuk.addEventListener('keyup', () => filterSurat('masuk'));
    }

   // Event listener untuk filter (bulan/tahun surat masuk)
    const filterBulanTahunMasuk = document.getElementById('filter-bulan-tahun-masuk');
    if (filterBulanTahunMasuk) {
        filterBulanTahunMasuk.addEventListener('keyup', () => filterSurat('masuk'));
    }

    // Event listener untuk filter (search input surat keluar)
    const searchInputKeluar = document.getElementById('search-input-keluar');
    if (searchInputKeluar) {
        searchInputKeluar.addEventListener('keyup', () => filterSurat('keluar'));
    }

    // Event listener untuk filter (bulan/tahun surat keluar)
    const filterBulanTahunKeluar = document.getElementById('filter-bulan-tahun-keluar');
    if (filterBulanTahunKeluar) {
        filterBulanTahunKeluar.addEventListener('keyup', () => filterSurat('keluar'));
    }
});