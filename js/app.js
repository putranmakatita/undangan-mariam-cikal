const sheetURL = 'https://script.google.com/macros/s/AKfycby9tyq0fOlaEo6mH5NrOAYg1sO2DQWzmGR-or3cO9aNiHE2LiLzh21EH4zVqbZM0BmUQw/exec';

const audio = (() => {
    let instance = null;

    let createOrGet = () => {
        if (instance instanceof HTMLAudioElement) {
            return instance;
        }

        instance = new Audio();
        instance.autoplay = true;
        instance.src = document.getElementById('tombol-musik').getAttribute('data-url');
        instance.load();
        instance.currentTime = 0;
        instance.volume = 1;
        instance.muted = false;
        instance.loop = true;

        return instance;
    }

    return {
        play: () => {
            createOrGet().play();
        },
        pause: () => {
            createOrGet().pause();
        }
    };
})();

const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const salin = (btn, msg = null) => {
    navigator.clipboard.writeText(btn.getAttribute('data-nomer'));
    let tmp = btn.innerHTML;
    btn.innerHTML = msg ?? 'Tersalin';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = tmp;
        btn.disabled = false;
        btn.focus();
    }, 1500);
};

const timer = () => {
    let countDownDate = (new Date(document.getElementById('tampilan-waktu').getAttribute('data-waktu').replace(' ', 'T'))).getTime();
    let time = null;
    let distance = null;

    time = setInterval(() => {
        distance = countDownDate - (new Date()).getTime();

        if (distance < 0) {
            clearInterval(time);
            time = null;
            return;
        }

        document.getElementById('hari').innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        document.getElementById('jam').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        document.getElementById('menit').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('detik').innerText = Math.floor((distance % (1000 * 60)) / 1000);
    }, 1000);
};

const buka = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('tombol-musik').style.display = 'block';
    audio.play();
    AOS.init();
    await login();

    timer();
};

const play = (btn) => {
    if (btn.getAttribute('data-status').toString() != 'true') {
        btn.setAttribute('data-status', 'true');
        audio.play();
        btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    } else {
        btn.setAttribute('data-status', 'false');
        audio.pause();
        btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    }
};

const resetForm = () => {
    document.getElementById('kirim').style.display = 'block';
    document.getElementById('hadiran').style.display = 'block';
    document.getElementById('labelhadir').style.display = 'block';
    document.getElementById('batal').style.display = 'none';
    document.getElementById('kirimbalasan').style.display = 'none';
    document.getElementById('idbalasan').value = null;
    document.getElementById('balasan').innerHTML = null;
    document.getElementById('formnama').value = null;
    document.getElementById('hadiran').value = 0;
    document.getElementById('formpesan').value = null;
};

const parseRequest = (method, token = null, body = null) => {
    let req = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        req.headers['Authorization'] = 'Bearer ' + token;
    }

    if (body) {
        req.body = JSON.stringify(body);
    }

    return req;
};

const getUrl = (optional = null) => {
    let url = document.querySelector('body').getAttribute('data-url');

    if (optional) {
        return url + optional;
    }

    return url;
};

const renderCard = (data) => {
    const DIV = document.createElement('div');
    DIV.classList.add('mb-3');
    DIV.innerHTML = `
    <div class="card-body bg-light shadow p-3 m-0 rounded-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center">
            <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                <strong class="me-1">${escapeHtml(data.nama)}</strong><i class="fa-solid ${data.hadir == 1 ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>
            </p>
            <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${data.timestamp}</small>
        </div>
        <hr class="text-dark my-1">
        <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${escapeHtml(data.komentar)}</p>
    </div>`;
    return DIV;
};

const renderLoading = (num) => {
    let hasil = '';
    for (let index = 0; index < num; index++) {
        hasil += `
        <div class="mb-3">
            <div class="card-body bg-light shadow p-3 m-0 rounded-4">
                <div class="d-flex flex-wrap justify-content-between align-items-center placeholder-glow">
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-3"></span>
                </div>
                <hr class="text-dark my-1">
                <p class="card-text placeholder-glow">
                    <span class="placeholder bg-secondary col-6"></span>
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-12"></span>
                </p>
            </div>
        </div>`;
    }

    return hasil;
};

const pagination = (() => {

    const perPage = 10;
    let pageNow = 0;
    let resultData = 0;

    let disabledPrevious = () => {
        document.getElementById('previous').classList.add('disabled');
    };

    let disabledNext = () => {
        document.getElementById('next').classList.add('disabled');
    };

    let buttonAction = async (button) => {
        let tmp = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;
        await ucapan();
        button.disabled = false;
        button.innerHTML = tmp;
        document.getElementById('daftarucapan').scrollIntoView({ behavior: 'smooth' });
    };

    return {
        getPer: () => {
            return perPage;
        },
        getNext: () => {
            return pageNow;
        },
        reset: async () => {
            pageNow = 0;
            resultData = 0;
            await ucapan();
            document.getElementById('next').classList.remove('disabled');
            disabledPrevious();
        },
        setResultData: (len) => {
            resultData = len;
            if (resultData < perPage) {
                disabledNext();
            }
        },
        previous: async (button) => {
            if (pageNow < 0) {
                disabledPrevious();
            } else {
                pageNow -= perPage;
                disabledNext();
                await buttonAction(button);
                document.getElementById('next').classList.remove('disabled');
                if (pageNow <= 0) {
                    disabledPrevious();
                }
            }
        },
        next: async (button) => {
            if (resultData < perPage) {
                disabledNext();
            } else {
                pageNow += perPage;
                disabledPrevious();
                await buttonAction(button);
                document.getElementById('previous').classList.remove('disabled');
            }
        }
    };
})();

const ucapan = async () => {
    const UCAPAN = document.getElementById('daftarucapan');
    UCAPAN.innerHTML = renderLoading(pagination.getPer());


    await fetch(sheetURL)
        .then((res) => res.json())
        .then((res) => {
            if (res !== null && res.length != 0) {
                UCAPAN.innerHTML = null;
                // res.forEach((data) => UCAPAN.appendChild(renderCard(data)));
                for (let index = 0; index < res.length; index++) {
                    UCAPAN.appendChild(renderCard(res[index]));
                }
                pagination.setResultData(res.length);

                if (res.length == 0) {
                    UCAPAN.innerHTML = `<div class="h6 text-center">Tidak ada data</div>`;
                }
            }

            // if (res.error.length != 0) {
            //     if (res.error[0] == 'Expired token') {
            //         alert('Terdapat kesalahan, token expired !');
            //         window.location.reload();
            //         return;
            //     }

            //     alert(res.error[0]);
            // }
        })
        .catch((err) => alert(err));
};

const login = async () => {
    document.getElementById('daftarucapan').innerHTML = renderLoading(pagination.getPer());
    ucapan();
};

const kirim = async () => {
    let nama = document.getElementById('formnama').value;
    let hadir = document.getElementById('hadiran').value;
    let komentar = document.getElementById('formpesan').value;

    if (nama.length == 0) {
        alert('nama tidak boleh kosong');
        return;
    }

    if (nama.length >= 35) {
        alert('panjangan nama maksimal 35');
        return;
    }

    if (hadir == 0) {
        alert('silahkan pilih kehadiran');
        return;
    }

    if (komentar.length == 0) {
        alert('pesan tidak boleh kosong');
        return;
    }

    document.getElementById('formnama').disabled = true;
    document.getElementById('hadiran').disabled = true;
    document.getElementById('formpesan').disabled = true;

    document.getElementById('kirim').disabled = true;
    let tmp = document.getElementById('kirim').innerHTML;
    document.getElementById('kirim').innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;

    formData = {
        nama: nama,
        hadir: hadir,
        komentar: komentar
    };

    await fetch(sheetURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.result == "success") {
                resetForm();
                pagination.reset();
            }
        })
        .catch((err) => {
            resetForm();
            alert(err);
        });

    document.getElementById('formnama').disabled = false;
    document.getElementById('hadiran').disabled = false;
    document.getElementById('formpesan').disabled = false;
    document.getElementById('kirim').disabled = false;
    document.getElementById('kirim').innerHTML = tmp;
};

const progressBar = (() => {
    let bar = document.getElementById('bar');
    let second = 0;
    let counter = 0;
    let stop = false;

    const sleep = (until) => new Promise((p) => {
        setTimeout(p, until);
    });

    const setNum = (num) => {
        bar.style.width = num + "%";
        bar.innerText = num + "%";

        return num == 100 || stop;
    };

    (async () => {
        while (true) {
            if (stop || setNum(counter)) {
                break;
            }

            await sleep(second);
            second += (counter * counter);
            counter += 1;
        }
    })();

    return {
        stop: () => {
            stop = true;
            setNum(100.0);
        }
    };
})();

const opacity = () => {
    let modal = new Promise((res) => {
        let clear = null;
        clear = setInterval(() => {
            if (document.getElementById('exampleModal').classList.contains('show')) {
                clearInterval(clear);
                res();
            }
        }, 100);
    });

    modal.then(() => {
        progressBar.stop();

        let op = parseInt(document.getElementById('loading').style.opacity);
        let clear = null;

        clear = setInterval(() => {
            if (op >= 0) {
                op -= 0.025;
                document.getElementById('loading').style.opacity = op;
            } else {
                clearInterval(clear);
                document.getElementById('loading').remove();
                document.getElementById('exampleModal').classList.add('fade');
            }
        }, 10);
    });
};

const fotoInject = (folder, listData, idCont, idIndic, dataTarget) => {
    let contFoto = document.getElementById(idCont);
    let indicFoto = document.getElementById(idIndic);

    let eRes = "";
    let eResIndic = "";

    for (let i = 0; i < listData.length; i++) {
        let active = i == 0 ? "active" : "";
        let activeIndic = i == 0 ? `class="active" aria-current="true"` : "";

        let curr = `<div class="carousel-item ${active}">
                    <img src="${folder}${listData[i]}" alt="${listData[i]}" class="d-block w-100" onclick="modalFoto(this)">
                </div>`;

        let currIndic = `<button type="button" data-bs-target="${dataTarget}" data-bs-slide-to="${i}"
                          ${activeIndic} aria-label="Slide ${i + 1}">
                        </button>`;
        eRes += curr;
        eResIndic += currIndic;
    }

    contFoto.innerHTML = eRes;
    indicFoto.innerHTML = eResIndic;
};

const modalFoto = (img) => {
    let modal = new bootstrap.Modal('#modalFoto');
    document.getElementById('showModalFoto').src = img.src;
    modal.show();
};

window.addEventListener('load', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // audio.play();
    let modal = new bootstrap.Modal('#exampleModal');
    let name = (new URLSearchParams(window.location.search)).get('to') ?? '';

    if (name.length == 0) {
        document.getElementById('namatamu').remove();
    } else {
        let div = document.createElement('div');
        div.classList.add('m-2');
        div.innerHTML = `
        <p class="mt-0 mb-1 mx-0 p-0 text-utama">Kepada Yth Bapak/Ibu/Saudara/i</p>
        <h2 class="text-utama">${escapeHtml(name)}</h2>
        `;

        document.getElementById('namatamu').appendChild(div);
    }

    modal.show();
    opacity();

    // foto galeri
    // let listFotoHeader = ["IMG_0863.JPG", "IMG_1018.JPG", "IMG_1019.JPG", "IMG_1020.JPG", "IMG_1013.JPG", "IMG_1014.JPG"];
    // let listFotoDetail = ["IMG_1017.JPG", "IMG_1008.JPG", "IMG_1009.JPG", "IMG_1010.JPG", "IMG_1011.JPG", "IMG_1021.JPG"];
    // let folder = "assets/images/";

    // // header
    // fotoInject(folder, listFotoHeader, "contFotoHeader", "fotoHeaderIndic", "#carouselExampleIndicators");

    // // // detail
    // fotoInject(folder, listFotoDetail, "contFotoDetail", "fotoDetailIndic", "#carousel2");

}, false);

let bgState = 1;
setInterval(function () {
    const bgKedua = document.getElementsByClassName("bg-kedua");

    // Add a slight delay before removing the class
    setTimeout(() => {
        bgKedua[0].classList.remove("bg-" + bgState);
        bgState = bgState === 1 ? 2 : 1;
        bgKedua[0].classList.add("bg-" + bgState);
    }, 50); // Adjust the delay as needed to ensure smooth transition

}, 3000);


const getDataKomentar = () => {


    fetch(sheetURL)
        .then(response => response.json())
        .then(data => {
            console.log(data)
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

