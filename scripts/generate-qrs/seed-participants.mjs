// Bulk seed: PDF'lerden çıkarılmış 195 katılımcıyı cards tablosuna yazar.
// Her kart komite + ad alfabetik sıraya göre kart numarası alır.
// Üstü çizik (iptal) isimler dahil edilmez. Açmadı notu olanlar dahil.
//
// Çalıştırma: node seed-participants.mjs           (yeni veriyi yazar, mevcutları üzerine yazar)
//            node seed-participants.mjs --dry      (DB'ye yazmadan plan göster)

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

const COMMITTEES = [
    'Kuantum Fiziği',
    'Nöropsikoloji',
    'Moleküler Biyoloji ve Genetik',
    'AI/Data/NLP',
    'Uçak ve Havacılık',
    'Adli Bilimler, Kriminalistik ve Toksikoloji',
    'Akıllı Sistemler ve Mühendislik Gelişim Projesi',
];

// PDF'lerden çıkarıldı (Notes_260429_152304 + GEÇ BAŞVURULAR DOC-20260423-WA0035).
// Üstü çizikler hariç, açmadı dahil. Duplicate isimler farklı email = farklı kart.
const PARTICIPANTS = [
    // ===== Kuantum Fiziği =====
    { name: 'Kadriye Kaya',           email: 'kadriye.606.kaya@gmail.com',          committee: 'Kuantum Fiziği' },
    { name: 'Meryem Şahin',           email: 'sahiinnmeryem@gmail.com',             committee: 'Kuantum Fiziği' },
    { name: 'Asya Yeşil',             email: 'asya.yesil10@gmail.com',              committee: 'Kuantum Fiziği' },
    { name: 'Hüseyin Çelikkol',       email: 'huseyincelikkol19@gmail.com',         committee: 'Kuantum Fiziği' },
    { name: 'Zeynep Zeren Kuloğlu',   email: 'kulogluzeynepzeren@gmail.com',        committee: 'Kuantum Fiziği' },
    { name: 'Oğuz Kaan Ertan',        email: 'oguzkaanertan@gmail.com',             committee: 'Kuantum Fiziği' },
    { name: 'Yusuf Yıldız',           email: 'yusufyyildiz2009@gmail.com',          committee: 'Kuantum Fiziği' },
    { name: 'Tanem Turuca',           email: 'flxwlqssly@gmail.com',                committee: 'Kuantum Fiziği' },
    { name: 'Efe Civelek',            email: 'eefecivelek@gmail.com',               committee: 'Kuantum Fiziği' },
    { name: 'Metehan Tırınkoğlu',     email: 'metehantirink28@gmail.com',           committee: 'Kuantum Fiziği' },
    { name: 'Selin Yurddaşer',        email: 'selinyurddaser@gmail.com',            committee: 'Kuantum Fiziği' },
    { name: 'Aybars Keskin',          email: 'aybarskeskin2010@gmail.com',          committee: 'Kuantum Fiziği' },
    { name: 'Kübranur Yıldız',        email: 'kubranuryildiz@maltepefenlisesi.k12.tr', committee: 'Kuantum Fiziği' },
    { name: 'İdil Işık',              email: 'idilozmumcu@gmail.com',               committee: 'Kuantum Fiziği' },
    { name: 'Elanur Karaca',          email: 'karacaelanur84@gmail.com',            committee: 'Kuantum Fiziği' },
    { name: 'Damla Koca',             email: 'kcdmlkc@gmail.com',                   committee: 'Kuantum Fiziği' },
    { name: 'Elif Naz Zorlu',         email: 'elifzorlu2020@gmail.com',             committee: 'Kuantum Fiziği' },
    { name: 'Duru Aparcı',            email: 'duruaparci34@gmail.com',              committee: 'Kuantum Fiziği' },
    { name: 'Ada Özçelikel',          email: 'ozcelikelberenada@gmail.com',         committee: 'Kuantum Fiziği' },
    { name: 'Zelal Ece Çelik',        email: 'zelalececelik@gmail.com',             committee: 'Kuantum Fiziği' },
    { name: 'Pelin Yüksel',           email: 'pelinyuksel2010@gmail.com',           committee: 'Kuantum Fiziği' },
    { name: 'Doruk Engin Işılganer',  email: 'drkislgnr@gmail.com',                 committee: 'Kuantum Fiziği' },
    // late apps
    { name: 'Sine Ecrin Göktaş',      email: 'sineecringoktas@gmail.com',           committee: 'Kuantum Fiziği' },
    // Meryem Şahin'in @icloud kaydı çıkarıldı (2026-04-30) — kullanıcı @gmail'i bıraktı.
    { name: 'Zeynep Elif Söğüt',      email: 'sogutzeynepelif@gmail.com',           committee: 'Kuantum Fiziği' },

    // ===== Nöropsikoloji =====
    { name: 'Ömür Şahin',             email: 'omurrssahinn@gmail.com',              committee: 'Nöropsikoloji' },
    { name: 'Duru Mıngır',            email: 'durumingir@gmail.com',                committee: 'Nöropsikoloji' },
    { name: 'Duru Kayserlioğlu',      email: 'kayserliogluduru@gmail.com',          committee: 'Nöropsikoloji' },
    { name: 'Besna Bakırhan',         email: 'bakirhanbesna163@gmail.com',          committee: 'Nöropsikoloji' },
    { name: 'Duru Gökmen',            email: 'gkmendr@gmail.com',                   committee: 'Nöropsikoloji' },
    { name: 'Selin Ceyda Durmuş',     email: 'sceyda.durms@gmail.com',              committee: 'Nöropsikoloji' },
    { name: 'Azra Ermiş',             email: '724.maltepefen@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Zümra Kuzu',             email: 'zumrakzu57@gmail.com',                committee: 'Nöropsikoloji' },
    { name: 'Deva Pişkin',            email: '696.maltepefen@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Ece Yavuz',              email: 'eceyavuz1011@gmail.com',              committee: 'Nöropsikoloji' },
    { name: 'Derin Su Çelik',         email: 'derinsucelik@maltepefenlisesi.k12.tr', committee: 'Nöropsikoloji' },
    { name: 'Ela Özüm Okumuş',        email: 'elaozlemokumus@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Asrem Nurçe Yıldız',     email: 'asremnurce.yildiz0611@gmail.com',     committee: 'Nöropsikoloji' },
    { name: 'Meryem Kartal',          email: 'kartalelif644@gmail.com',             committee: 'Nöropsikoloji' },
    { name: 'Cemre Bekdemir',         email: 'cmrbekdemir@gmail.com',               committee: 'Nöropsikoloji' },
    { name: 'Yavuz Selim Hanağası',   email: 'joker.yavuz2023@gmail.com',           committee: 'Nöropsikoloji' },
    { name: 'Yuşa Emin Yazar',        email: 'yusaeminyazar@gmail.com',             committee: 'Nöropsikoloji' },
    { name: 'Yiğit Efe Telli',        email: 'yigitefetelli37@gmail.com',           committee: 'Nöropsikoloji' },
    { name: 'Elif Ece Yılmaz',        email: 'elifceyilmazz@gmail.com',             committee: 'Nöropsikoloji' },
    { name: 'Fatma Keleş',            email: '627maltepefen123@gmail.com',          committee: 'Nöropsikoloji' },
    { name: 'Ebru Kaya',              email: 'kaya372965@gmail.com',                committee: 'Nöropsikoloji' },
    { name: 'Nisa Ak',                email: 'wed.adams14@gmail.com',               committee: 'Nöropsikoloji' },
    { name: 'Sümeyye Betül Barın',    email: 'barinbetul626@gmail.com',             committee: 'Nöropsikoloji' },
    // late
    { name: 'Hüseyin Tuna Odabaşı',   email: 'tunaodabasi2010@gmail.com',           committee: 'Nöropsikoloji' },
    { name: 'Beyzanur Ekin',          email: 'ekinbeyzanur35@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Doğa Yonar',             email: 'dogayonar@gmail.com',                 committee: 'Nöropsikoloji' },
    { name: 'Zeynep Asu Aydın',       email: 'aydinzeynepasu@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Zeynep Öykü Yenigün',    email: 'oykuyenigunbilsem@gmail.com',         committee: 'Nöropsikoloji' },
    { name: 'Nilay Polat',            email: 'nilay.polat3333@gmail.com',           committee: 'Nöropsikoloji' },
    { name: 'Ecrin Şimal Fidan',      email: 'ecrn08sml16fdn@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Gülbeyaz Sude Yücel',    email: 'gulbeyazsude58@gmail.com',            committee: 'Nöropsikoloji' },
    { name: 'Damla Akgül',            email: 'dmlakgl2404@gmail.com',               committee: 'Nöropsikoloji' },
    { name: 'Esma Gündöndü',          email: 'gundonduesma6@gmail.com',             committee: 'Nöropsikoloji' },
    { name: 'Yağmur İkizdere',        email: 'yagmurikizdere@gmail.com',            committee: 'Nöropsikoloji' },

    // ===== Moleküler Biyoloji ve Genetik =====
    { name: 'Cansu Çevreli',          email: 'cansucevreli@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Eylül Defne Yücel',      email: 'eyluldefneyucel67@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Elif Yağmur Gürhan',     email: 'elifyagmurgurhan@gmail.com',          committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Ayşe Hüma Ekinci',       email: 'aysehumaekinci5@gmail.com',           committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Elif Varol',             email: 'elifvarol040@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Sevde Atlas',            email: 'sevdeatlas@gmail.com',                committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Zeynep Çiftçi',          email: 'zeynepcftc24@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Selin Akçin',            email: 'selinakcin8@gmail.com',               committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Eylül Eda Dal',          email: 'eyluleda2434@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Ceren Yıldıran',         email: 'crnyldrn1307@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Nehir Maviş',            email: 'mavis82nehir@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Ayça Avcı',              email: 'ayca.avci3453@gmail.com',             committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Deniz Bilgi',            email: 'denizz3bilgii@icloud.com',            committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Rabia Ayça Kale',        email: 'rabiaaycakale34@gmail.com',           committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Gizem Salar',            email: 'gizem.salar61@gmail.com',             committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Elif Duru Kayaoğlu',     email: 'durukayaoglu88@gmail.com',            committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Damla Ceren Genç',       email: 'damlacgnc@gmail.com',                 committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Gün Ekin Özden',         email: 'g.ekinozden@gmail.com',               committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Yağmur Beren Yılmaz',    email: 'yagmurberenyilmaz@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Şehriban Deniz',         email: 'denizsehriban3465@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Melisa Molo',            email: 'mlo.mel036@gmail.com',                committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Aysel Büşra Çelik',      email: 'celikaysel.b09@gmail.com',            committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Ecrin Demirtaş',         email: 'ecrindemirtas4444@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Kuzey Acar',             email: 'kuzeyacar31@gmail.com',               committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Eren Kaan Fazlıoğlu',    email: 'fazlioglueren06@gmail.com',           committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Ömer Tuna Güner',        email: 'omertunasan@gmail.com',               committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Deniz Aydemir',          email: 'denizaydemir018@gmail.com',           committee: 'Moleküler Biyoloji ve Genetik' },
    // late
    { name: 'Şevval Ok',              email: 'sevval.9ok@gmail.com',                committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Sevde Arife Yeşilyurt',  email: 'sevdeyesilyurt101@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Nehir Sağır',            email: 'nehirsagir2853@gmail.com',            committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Toprak Erdem',           email: 'toprakerdem1933@gmail.com',           committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Zeynep Ula',             email: 'zeynp.gke04@icloud.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Era Yağmur Gökdemir',    email: 'erayagmurgokdemir@gmail.com',         committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Nil Zorlu',              email: 'nilzorlu14@gmail.com',                committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'İlkim Zeynep Üner',      email: 'zeynepunerr0@gmail.com',              committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Meryem Saide Yılmaz',    email: 'merymsyyy@icloud.com',                committee: 'Moleküler Biyoloji ve Genetik' },
    { name: 'Rana İdil Erdağ',        email: 'ranaidilerdag@gmail.com',             committee: 'Moleküler Biyoloji ve Genetik' },

    // ===== AI/Data/NLP =====
    { name: 'Sinan Tahsin Korkmaz',   email: 'sinantahsinkrkmz@gmail.com',          committee: 'AI/Data/NLP' },
    { name: 'Emir Buğra Kocagöz',     email: 'emirkral1309@gmail.com',              committee: 'AI/Data/NLP' },
    { name: 'Nur Evşan Ceylan',       email: 'nrvsn_cyln@icloud.com',               committee: 'AI/Data/NLP' },
    { name: 'Murat Ege Ünsal',        email: 'murategeunsal@gmail.com',             committee: 'AI/Data/NLP' },
    { name: 'Melih Gerez',            email: 'melihgerez@gmail.com',                committee: 'AI/Data/NLP' },
    { name: 'Muhammed Ali Demir',     email: 'dmr.muhammmed.ali@gmail.com',         committee: 'AI/Data/NLP' },
    { name: 'Yiğit Kemal Yaşar',      email: 'ykemalyasar2009@gmail.com',           committee: 'AI/Data/NLP' },
    { name: 'Elif Nida Şeker',        email: 'elifff_seekerr@gmail.com',            committee: 'AI/Data/NLP' },
    { name: 'Defne Gül Sağlam',       email: 'guldefnegul11@gmail.com',             committee: 'AI/Data/NLP' },
    { name: 'Tuana Eyüboğlu',         email: 'tuanaeyuboglu@icloud.com',            committee: 'AI/Data/NLP' },
    { name: 'Erem Habip',             email: 'eremhabip16@gmail.com',               committee: 'AI/Data/NLP' },
    // late
    { name: 'Hanan Ayhan',            email: 'hanan.ayhan72@gmail.com',             committee: 'AI/Data/NLP' },
    { name: 'Zeynep Duru Arslan',     email: 'zeynepduru0909@gmail.com',            committee: 'AI/Data/NLP' },

    // ===== Uçak ve Havacılık =====
    { name: 'Reyyan Taşkın',          email: 'reyyantaskin3@gmail.com',             committee: 'Uçak ve Havacılık' },
    { name: 'Ada Deniz Kalecik',      email: 'adaciklnl@gmail.com',                 committee: 'Uçak ve Havacılık' },
    { name: 'Melih Kaya',             email: 'melih2193@gmail.com',                 committee: 'Uçak ve Havacılık' },
    { name: 'Şems Dönmez',            email: 'semsdonmez34@gmail.com',              committee: 'Uçak ve Havacılık' },
    { name: 'Yavuz Ovacıklıoğlu',     email: 'yavuzovaciklioglu1@gmail.com',        committee: 'Uçak ve Havacılık' },
    { name: 'Barış Günemre',          email: 'baris.gunemre@icloud.com',            committee: 'Uçak ve Havacılık' },
    { name: 'Alya Gökdeniz',          email: 'alyagokdeniz4@gmail.com',             committee: 'Uçak ve Havacılık' },
    { name: 'Doruk Gökdeniz',         email: 'dorukgokdeniz@gmail.com',             committee: 'Uçak ve Havacılık' },
    { name: 'Melek Naz',              email: 'mmeleknaz2834@gmail.com',             committee: 'Uçak ve Havacılık' },
    { name: 'Zeynep Erdoğan',         email: 'zebi2177@gmail.com',                  committee: 'Uçak ve Havacılık' },
    { name: 'Ali Beşbenli',           email: 'abesbenli@gmail.com',                 committee: 'Uçak ve Havacılık' },
    { name: 'Emirhan Oğuzhan',        email: 'emirroguzhan10@gmail.com',            committee: 'Uçak ve Havacılık' },
    // late
    { name: 'Hatice Ortaç',           email: 'haticeortac18@gmail.com',             committee: 'Uçak ve Havacılık' },
    { name: 'Mustafa Konuk',          email: 'mustafa80konuk@gmail.com',            committee: 'Uçak ve Havacılık' },
    { name: 'Ömer Karaaslan',         email: 'karaomer2011@gmail.com',              committee: 'Uçak ve Havacılık' },
    { name: 'Berna Yetim',            email: 'bernaytm2010@gmail.com',              committee: 'Uçak ve Havacılık' },
    { name: 'Efe Yiğiter',            email: 'efeyigiter20@gmail.com',              committee: 'Uçak ve Havacılık' },
    { name: 'Ali Egemen Güler',       email: 'guleraliegemen@gmail.com',            committee: 'Uçak ve Havacılık' },
    { name: 'Ada Soğuktaş',           email: 'adasoguktas@gmail.com',               committee: 'Uçak ve Havacılık' },
    { name: 'Ömür Turgut',            email: 'omurturgut924@gmail.com',             committee: 'Uçak ve Havacılık' },

    // ===== Adli Bilimler, Kriminalistik ve Toksikoloji =====
    { name: 'Gizem Havuz',            email: 'gizem.havuz11@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Ada Günhan',             email: 'gunhanada@gmail.com',                 committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Nil Hacısalihoğlu',      email: 'nilhacisalihogluu@gmail.com',         committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Hümeyra Bayraktar',      email: 'humeyrabayraktar76@gmail.com',        committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Fatma Hiranur Uyar',     email: 'fatmahiranuruyar@gmail.com',          committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Ece Talu',               email: 'eceta01@gmail.com',                   committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Beren Şayan',            email: 'berensay3038@gmail.com',              committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Elif Damla Yerli',       email: 'yerlielifdamla@gmail.com',            committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Betül Şiranlı',          email: 'okabhawli@gmail.com',                 committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Rümeysa Aydın',          email: 'rumeysaaydin676@gmail.com',           committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Naz Talu',               email: 'naztal01@gmail.com',                  committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Eylül Zümra Külekçi',    email: 'eyyzuu@gmail.com',                    committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Beyza Gülşen Özbaşı',    email: 'bgozbasi10@gmail.com',                committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Meyra Vatanseven',       email: 'meyravatanseven@gmail.com',           committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Merve Çipiloğlu',        email: 'mrv.cipiloglu@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Dicle Bade Yakut',       email: 'yakutbade@gmail.com',                 committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Duru Sivri',             email: 'ds.durusivri@gmail.com',              committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Sueda Aydoğan',          email: 'sueda09aydogan@gmail.com',            committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Çakıl Çancı',            email: 'cancicakil@gmail.com',                committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Duru Bayram',            email: 'durubyr@gmail.com',                   committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Fatma Esma Büyükbayraktar', email: 'esmabuyukbayraktar@gmail.com',     committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Defne Uslu',             email: 'defne.uslu20@gmail.com',              committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Nisa Merve Sertkaya',    email: 'sertkayanisamerve@gmail.com',         committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Hayrunnisa Kentel',      email: 'hayrunnisakentel@gmail.com',          committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'İrem Özkara',            email: 'iremozkara28@gmail.com',              committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    // late
    { name: 'Şimal Taştepe',          email: 'tastepesimal0@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Argon Enes Özpınar',     email: 'ozpinarenes10@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    // Berra Ergün'ün Adli'deki @gmail kaydı çıkarıldı (2026-04-30) — kullanıcı onu Akıllı'da bıraktı.
    { name: 'Ayşe Özyaşar',           email: 'ayseozyasar09@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Ada Vardar',             email: 'adavrdr43@gmail.com',                 committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Elif Özyaşar',           email: 'elifozyasar09@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Ecrin Naz Bayram',       email: 'ecrinnazbayram@gmail.com',            committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Gözde Başlı',            email: 'gozdebasli4@gmail.com',               committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Zehra Hamide Kızıldağ',  email: 'zehra.kizildag.23@gmail.com',         committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Eylül Nafiye Yılmaz',    email: 'eylulnafiyeyilmaz@gmail.com',         committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Emine Sude Önal',        email: 'onaleminesude@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Berfin Aktaş',           email: 'berfinaktass57@gmail.com',            committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Rabia İclal Kandemir',   email: null,                                  committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Nilüfer Deniz Altan',    email: 'niluferdenizaltan55@gmail.com',       committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Duru Özlük',             email: 'duruozluk23@gmail.com',               committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Arda Ünsal',             email: 'unsalarda3443@gmail.com',             committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },
    { name: 'Nazlı Zerya Küçükkaya',  email: 'nazlizerya04@gmail.com',              committee: 'Adli Bilimler, Kriminalistik ve Toksikoloji' },

    // ===== Akıllı Sistemler ve Mühendislik Gelişim Projesi =====
    { name: 'Meryem Ecrin Aktürk',    email: 'ecrinakturk2@gmail.com',              committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Muhammed Efe Yıldırım',  email: 'mefe90035@gmail.com',                 committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Ayşe Dila Akarçeşme',    email: 'dilaakrcsm@gmail.com',                committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Çağatay Coşkun',         email: 'coskuncagatay2@gmail.com',            committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Ecrin Bade Arslan',      email: 'arslan.ecrinbade@gmail.com',          committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Burhan Efe Kocaeli',     email: 'kocaeliburhanefe@gmail.com',          committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Derin Yayla',            email: 'drnyayla@gmail.com',                  committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Berra Ergün',            email: 'ergunberra53@icloud.com',             committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Defne Ebrar Karaca',     email: 'defneebrar.karaca@gmail.com',         committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Mustafa Görkem Küçük',   email: 'dilaraakgul821@gmail.com',            committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Sudem Doğan',            email: 'sudemdilsad@gmail.com',               committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Kezban Nur Pamuk',       email: 'pamuknur391@gmail.com',               committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Uras Gürsançtı',         email: 'urasgursacti@gmail.com',              committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Aras Biçer',             email: 'arasbicer1511@gmail.com',             committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    // late
    { name: 'Elvin Tekyıldız',        email: 'elvin.tekyildiz@gmail.com',           committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Ada Defne Şahin',        email: 'defneqwexewq@gmail.com',              committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Pars Kalafat',           email: 'parskalafat@anabilim.net',            committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Nejdet Demir Demirci',   email: 'nejdetdemirdemirci@gmail.com',        committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Alp Eren Akay',          email: 'alperenakay@gmail.com',               committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Batuhan Vural',          email: 'batuhaanvuraal@gmail.com',            committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Eren Güngör',            email: 'erengungor730@gmail.com',             committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
    { name: 'Eren Kasım Patlar',      email: 'erenpatlar2010@gmail.com',            committee: 'Akıllı Sistemler ve Mühendislik Gelişim Projesi' },
];

// ============= main =============
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env\'de olmalı.'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const dryRun = process.argv.includes('--dry');

// Sırala: önce komite sırası, sonra ad alfabetik
const trCollator = new Intl.Collator('tr', { sensitivity: 'base' });
const sorted = [...PARTICIPANTS].sort((a, b) => {
    const ci = COMMITTEES.indexOf(a.committee) - COMMITTEES.indexOf(b.committee);
    if (ci !== 0) return ci;
    return trCollator.compare(a.name, b.name);
});

console.log(`Toplam katılımcı: ${sorted.length}`);
const counts = {};
for (const p of sorted) counts[p.committee] = (counts[p.committee] || 0) + 1;
for (const c of COMMITTEES) console.log(`  ${c}: ${counts[c] || 0}`);

if (dryRun) {
    console.log('\n--dry: DB\'ye yazılmayacak. İlk 10 atama:');
    sorted.slice(0, 10).forEach((p, i) => {
        console.log(`  ${String(i + 1).padStart(3, '0')} → ${p.name} (${p.committee.slice(0, 20)})`);
    });
    process.exit(0);
}

// 400 kartı sıraya çek
const { data: cards, error: cardsErr } = await sb.from('cards')
    .select('short_code, id').order('short_code');
if (cardsErr) { console.error('cards fetch:', cardsErr); process.exit(1); }
if (cards.length < sorted.length) {
    console.error(`Yeterli kart yok: cards=${cards.length}, gerekli=${sorted.length}`);
    process.exit(1);
}

console.log('\n1) Mevcut tüm kartlardan name/email/committee temizle (eski Ada Vardar test seed dahil)...');
const { error: clearErr } = await sb.from('cards')
    .update({ name: null, email: null, committee: null })
    .not('id', 'is', null);
if (clearErr) { console.error('clear:', clearErr); process.exit(1); }

console.log('2) Yeni atamalar yazılıyor...');
const csvRows = ['short_code,name,email,committee'];
for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const card = cards[i];
    const { error } = await sb.from('cards').update({
        name: p.name, email: p.email, committee: p.committee
    }).eq('short_code', card.short_code);
    if (error) { console.error(`update ${card.short_code}:`, error); process.exit(1); }
    const csvName = `"${p.name.replace(/"/g, '""')}"`;
    const csvCom  = `"${p.committee.replace(/"/g, '""')}"`;
    csvRows.push(`${card.short_code},${csvName},${p.email || ''},${csvCom}`);
    if ((i + 1) % 25 === 0) console.log(`   ${i + 1}/${sorted.length}`);
}
console.log(`   ${sorted.length}/${sorted.length} OK`);

const outDir = resolve(__dirname, 'output');
const csvPath = resolve(outDir, 'cards-assigned.csv');
writeFileSync(csvPath, '﻿' + csvRows.join('\n'), 'utf-8');
console.log(`\n3) Tasarımcı CSV'si yazıldı: ${csvPath}`);

const { count } = await sb.from('cards').select('*', { count: 'exact', head: true })
    .not('name', 'is', null);
console.log(`\nDB durumu: ${count} kart kişiye bağlı, ${cards.length - count} anonim rezerv.`);
