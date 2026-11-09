/**
 * SmartID Profile Generator - Updated Script
 * Core Logic: Auto English-to-Urdu Transliteration, Strict DD/MM/YYYY Dates & html2canvas Download
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. Element Selectors
  // =========================================================================
  
  // Form Inputs
  const form = document.getElementById('idGeneratorForm');
  const fullNameInput = document.getElementById('fullName');
  const fatherNameInput = document.getElementById('fatherName');
  const genderInput = document.getElementById('gender');
  const countryInput = document.getElementById('country');
  const cnicInput = document.getElementById('identityNumber');
  const dobInput = document.getElementById('dob');
  const issueDateInput = document.getElementById('issueDate');
  const expiryDateInput = document.getElementById('expiryDate');
  const profilePicInput = document.getElementById('profilePic');
  const fileUploadContainer = document.getElementById('fileUploadContainer');
  const signatureInput = document.getElementById('signatureText');
  const generateBtn = document.getElementById('generateBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // Form Live Hints
  const liveUrduNameHint = document.getElementById('liveUrduNameHint');
  const liveUrduFatherHint = document.getElementById('liveUrduFatherHint');

  // ID Card Preview Container & Overlay Elements
  const idCard = document.getElementById('idCardPreview') || document.getElementById('idCard');
  const cardName = document.getElementById('cardName');
  const cardUrduName = document.getElementById('cardUrduName');
  const cardFatherName = document.getElementById('cardFatherName');
  const cardUrduFatherName = document.getElementById('cardUrduFatherName');
  const cardGender = document.getElementById('cardGender');
  const cardCountry = document.getElementById('cardCountry');
  const cardCnic = document.getElementById('cardCnic');
  const cardDob = document.getElementById('cardDob');
  const cardIssueDate = document.getElementById('cardIssueDate');
  const cardExpiryDate = document.getElementById('cardExpiryDate');
  const cardPhotoBox = document.getElementById('cardPhotoBox');
  const cardSignatureText = document.getElementById('cardSignatureText');

  // State
  let uploadedPhotoDataUrl = null;
  let nameTranslitTimer = null;
  let fatherTranslitTimer = null;

  // =========================================================================
  // 2. Strict Date Formatting (DD/MM/YYYY)
  // =========================================================================

  /**
   * Format a Date object strictly into 'DD/MM/YYYY'
   * @param {Date} dateObj
   * @returns {string} e.g. "09/11/2026"
   */
  function formatDisplayDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format any date string (e.g. YYYY-MM-DD from HTML date input) to 'DD/MM/YYYY'
   * @param {string} dateString
   * @returns {string}
   */
  function formatDateString(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : formatDisplayDate(d);
  }

  /**
   * Format Date object to YYYY-MM-DD for HTML5 date inputs
   * @param {Date} dateObj
   * @returns {string}
   */
  function toHtmlInputDateFormat(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${year}-${month}-${day}`;
  }

  // =========================================================================
  // 3. Automated Dates Logic (Date of Issue & Date of Expiry = Issue + 10 Years)
  // =========================================================================

  function initializeAutomatedDates() {
    const today = new Date();
    
    // Exactly 10 years after Issue Date
    const expiry = new Date(today);
    expiry.setFullYear(today.getFullYear() + 10);

    // Pre-populate form inputs if empty
    if (issueDateInput && !issueDateInput.value) {
      issueDateInput.value = toHtmlInputDateFormat(today);
    }
    if (expiryDateInput && !expiryDateInput.value) {
      expiryDateInput.value = toHtmlInputDateFormat(expiry);
    }

    // Render strictly onto card preview overlay in DD/MM/YYYY format
    if (cardIssueDate) {
      cardIssueDate.textContent = formatDisplayDate(today);
    }
    if (cardExpiryDate) {
      cardExpiryDate.textContent = formatDisplayDate(expiry);
    }
  }

  // Re-sync Expiry Date when Issue Date is manually changed
  if (issueDateInput) {
    issueDateInput.addEventListener('change', () => {
      if (issueDateInput.value) {
        const selectedIssue = new Date(issueDateInput.value + 'T00:00:00');
        if (!isNaN(selectedIssue.getTime())) {
          const autoExpiry = new Date(selectedIssue);
          autoExpiry.setFullYear(selectedIssue.getFullYear() + 10);
          if (expiryDateInput) {
            expiryDateInput.value = toHtmlInputDateFormat(autoExpiry);
          }
          if (cardIssueDate) {
            cardIssueDate.textContent = formatDisplayDate(selectedIssue);
          }
          if (cardExpiryDate) {
            cardExpiryDate.textContent = formatDisplayDate(autoExpiry);
          }
        }
      }
    });
  }

  if (expiryDateInput) {
    expiryDateInput.addEventListener('change', () => {
      if (expiryDateInput.value && cardExpiryDate) {
        cardExpiryDate.textContent = formatDateString(expiryDateInput.value);
      }
    });
  }

  // =========================================================================
  // 4. Auto English-to-Urdu Transliteration Engine
  // =========================================================================

  // Comprehensive Roman-to-Urdu Dictionary for standard Pakistani names
  const urduDictionary = {
    'muhammad': 'محمد', 'mohammad': 'محمد', 'mohammed': 'محمد', 'md': 'محمد',
    'ali': 'علی', 'ahmed': 'احمد', 'ahmad': 'احمد', 'tariq': 'طارق',
    'mehmood': 'محمود', 'mahmood': 'محمود', 'hussain': 'حسین', 'hasan': 'حسن',
    'hassan': 'حسن', 'khan': 'خان', 'saif': 'سیف', 'ullah': 'اللہ',
    'saifullah': 'سیف اللہ', 'ghulam': 'غلام', 'usman': 'عثمان', 'umar': 'عمر',
    'omer': 'عمر', 'hamza': 'حمزہ', 'bilal': 'بلال', 'zain': 'زین',
    'abdul': 'عبدال', 'rehman': 'رحمٰن', 'rashid': 'راشد', 'shah': 'شاہ',
    'syed': 'سید', 'iqbal': 'اقبال', 'imran': 'عمران', 'kamran': 'کامران',
    'asif': 'آصف', 'irfan': 'عرفان', 'fatima': 'فاطمہ', 'aisha': 'عائشہ',
    'ayesha': 'عائشہ', 'maryam': 'مریم', 'zainab': 'زینب', 'sana': 'ثناء',
    'hina': 'حنا', 'amna': 'آمنہ', 'sidra': 'سدرہ', 'noor': 'نور',
    'farhan': 'فرحان', 'rizwan': 'رضوان', 'salman': 'سلمان', 'adnan': 'عدنان',
    'waqas': 'وقاص', 'faisal': 'فیصل', 'kashif': 'کاشف', 'nadeem': 'ندیم',
    'naveed': 'نوید', 'shafiq': 'شفیق', 'babar': 'بابر', 'arshad': 'ارشد',
    'akram': 'اکرم', 'aslam': 'اسلم', 'zahid': 'زاہد', 'shahid': 'شاہد',
    'nasir': 'ناصر', 'sajid': 'ساجد', 'amjad': 'امجد', 'waheed': 'وحید',
    'habib': 'حبیب', 'jamal': 'جمال', 'sohail': 'سہیل', 'zubair': 'زبیر',
    'sheikh': 'شیخ', 'malik': 'ملک', 'chaudhry': 'چوہدری', 'choudhry': 'چوہدری',
    'raja': 'راجہ', 'mir': 'میر', 'ansari': 'انصاری', 'qasmi': 'قاسمی'
  };

  /**
   * Fast rule-based phonetic transliteration fallback for words not in dictionary
   * @param {string} word
   * @returns {string}
   */
  function phoneticTransliterateWord(word) {
    if (!word) return '';
    const lower = word.toLowerCase().trim();
    if (urduDictionary[lower]) return urduDictionary[lower];

    const rules = [
      [/^aa/g, 'آ'], [/^a/g, 'ا'], [/kh/g, 'خ'], [/gh/g, 'غ'], [/sh/g, 'ش'],
      [/th/g, 'تھ'], [/dh/g, 'دھ'], [/ch/g, 'چ'], [/ph/g, 'پھ'], [/zh/g, 'ژ'],
      [/b/g, 'ب'], [/p/g, 'پ'], [/t/g, 'ت'], [/j/g, 'ج'], [/d/g, 'د'],
      [/r/g, 'ر'], [/z/g, 'ز'], [/s/g, 'س'], [/f/g, 'ف'], [/q/g, 'ق'],
      [/k/g, 'ک'], [/g/g, 'گ'], [/l/g, 'ل'], [/m/g, 'م'], [/n/g, 'ن'],
      [/v/g, 'و'], [/w/g, 'و'], [/h/g, 'ہ'], [/y/g, 'ی'], [/ee/g, 'ی'],
      [/oo/g, 'و'], [/o/g, 'و'], [/u/g, 'و'], [/i/g, 'ی'], [/e/g, 'ے']
    ];

    let result = lower;
    rules.forEach(([pattern, repl]) => {
      result = result.replace(pattern, repl);
    });

    return result.replace(/[a-z]/gi, '');
  }

  /**
   * Transliterate a full English phrase to Urdu (Dictionary + Google API)
   * @param {string} text
   * @returns {Promise<string>}
   */
  async function transliterateToUrdu(text) {
    if (!text || !text.trim()) return '';
    const cleanText = text.trim();

    // 1. Instant local transliteration for immediate responsiveness
    const words = cleanText.split(/\s+/);
    const localResult = words.map(w => urduDictionary[w.toLowerCase()] || phoneticTransliterateWord(w)).join(' ');

    // 2. Accurate transliteration via Google Input Tools API
    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(cleanText)}&itc=ur-t-i0-und&num=1`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] === 'SUCCESS' && Array.isArray(data[1])) {
          const apiWords = data[1].map(item => item[1] && item[1][0]).filter(Boolean);
          if (apiWords.length > 0) {
            return apiWords.join(' ');
          }
        }
      }
    } catch (err) {
      // Offline fallback: returns local transliteration
    }

    return localResult || cleanText;
  }

  // Real-time listener for Full Name input
  if (fullNameInput) {
    fullNameInput.addEventListener('input', () => {
      const val = fullNameInput.value.trim();

      // Update English Name on Card
      if (cardName) {
        cardName.textContent = val ? val.toUpperCase() : 'MUHAMMAD ALI';
      }

      // Update Signature suggestion if signature box is untouched
      if (signatureInput && !signatureInput.value.trim()) {
        const parts = val.split(/\s+/);
        const sig = parts.length > 1 ? `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}` : parts[0];
        if (cardSignatureText) cardSignatureText.textContent = sig || 'M. Ali';
      }

      // Instant local transliteration for zero latency
      const quickUrdu = val.split(/\s+/).map(w => urduDictionary[w.toLowerCase()] || phoneticTransliterateWord(w)).join(' ');
      if (cardUrduName && quickUrdu) cardUrduName.textContent = quickUrdu;
      if (liveUrduNameHint && quickUrdu) liveUrduNameHint.textContent = quickUrdu;

      // Debounced call to Google API for optimal spelling
      clearTimeout(nameTranslitTimer);
      nameTranslitTimer = setTimeout(async () => {
        if (!val) {
          if (cardUrduName) cardUrduName.textContent = 'محمد علی';
          if (liveUrduNameHint) liveUrduNameHint.textContent = 'محمد علی';
          return;
        }
        const preciseUrdu = await transliterateToUrdu(val);
        if (cardUrduName && preciseUrdu) cardUrduName.textContent = preciseUrdu;
        if (liveUrduNameHint && preciseUrdu) liveUrduNameHint.textContent = preciseUrdu;
      }, 250);
    });
  }

  // Real-time listener for Father's Name input
  if (fatherNameInput) {
    fatherNameInput.addEventListener('input', () => {
      const val = fatherNameInput.value.trim();

      // Update English Father's Name on Card
      if (cardFatherName) {
        cardFatherName.textContent = val ? val.toUpperCase() : 'TARIQ MEHMOOD';
      }

      // Instant local transliteration
      const quickUrdu = val.split(/\s+/).map(w => urduDictionary[w.toLowerCase()] || phoneticTransliterateWord(w)).join(' ');
      if (cardUrduFatherName && quickUrdu) cardUrduFatherName.textContent = quickUrdu;
      if (liveUrduFatherHint && quickUrdu) liveUrduFatherHint.textContent = quickUrdu;

      // Debounced call to Google API
      clearTimeout(fatherTranslitTimer);
      fatherTranslitTimer = setTimeout(async () => {
        if (!val) {
          if (cardUrduFatherName) cardUrduFatherName.textContent = 'طارق محمود';
          if (liveUrduFatherHint) liveUrduFatherHint.textContent = 'طارق محمود';
          return;
        }
        const preciseUrdu = await transliterateToUrdu(val);
        if (cardUrduFatherName && preciseUrdu) cardUrduFatherName.textContent = preciseUrdu;
        if (liveUrduFatherHint && preciseUrdu) liveUrduFatherHint.textContent = preciseUrdu;
      }, 250);
    });
  }

  // =========================================================================
  // 5. Live Profile Picture Preview (FileReader API)
  // =========================================================================

  function handleProfilePictureFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedPhotoDataUrl = event.target.result;
      renderCardPhoto(uploadedPhotoDataUrl);

      const uploadText = fileUploadContainer?.querySelector('.upload-text');
      if (uploadText) {
        uploadText.innerHTML = `<span class="upload-main" style="color:#34d399;">✓ ${file.name}</span> selected`;
      }
    };
    reader.readAsDataURL(file);
  }

  function renderCardPhoto(dataUrl) {
    if (!cardPhotoBox) return;

    cardPhotoBox.innerHTML = '';
    cardPhotoBox.classList.add('has-photo');

    const img = document.createElement('img');
    img.id = 'cardPhotoImg';
    img.className = 'card-photo-img';
    img.src = dataUrl;
    img.alt = 'Holder Profile Photo';

    cardPhotoBox.appendChild(img);
  }

  if (profilePicInput) {
    profilePicInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleProfilePictureFile(file);
    });
  }

  if (fileUploadContainer) {
    ['dragenter', 'dragover'].forEach(eventName => {
      fileUploadContainer.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadContainer.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      fileUploadContainer.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadContainer.classList.remove('drag-active');
      });
    });

    fileUploadContainer.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt?.files && dt.files[0];
      if (file) {
        if (profilePicInput) profilePicInput.files = dt.files;
        handleProfilePictureFile(file);
      }
    });
  }

  // =========================================================================
  // 6. Real-Time Signature
  // =========================================================================

  if (signatureInput) {
    signatureInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (cardSignatureText) {
        cardSignatureText.textContent = val || 'M. Ali';
      }
    });
  }

  // CNIC Auto-Hyphenation (XXXXX-XXXXXXX-X)
  if (cnicInput) {
    cnicInput.addEventListener('input', (e) => {
      let digits = e.target.value.replace(/\D/g, '').substring(0, 13);
      let formatted = '';
      if (digits.length > 0) formatted += digits.substring(0, 5);
      if (digits.length > 5) formatted += '-' + digits.substring(5, 12);
      if (digits.length > 12) formatted += '-' + digits.substring(12, 13);
      e.target.value = formatted;
    });
  }

  // =========================================================================
  // 7. Form Mapping on "Generate ID Card"
  // =========================================================================

  async function generateIdCard() {
    // 1. Full Name (English & Auto-Urdu)
    const nameVal = fullNameInput?.value.trim();
    if (cardName) cardName.textContent = nameVal ? nameVal.toUpperCase() : 'MUHAMMAD ALI';
    if (nameVal) {
      const urduVal = await transliterateToUrdu(nameVal);
      if (cardUrduName) cardUrduName.textContent = urduVal;
    }

    // 2. Father's Name (English & Auto-Urdu)
    const fatherVal = fatherNameInput?.value.trim();
    if (cardFatherName) cardFatherName.textContent = fatherVal ? fatherVal.toUpperCase() : 'TARIQ MEHMOOD';
    if (fatherVal) {
      const urduFatherVal = await transliterateToUrdu(fatherVal);
      if (cardUrduFatherName) cardUrduFatherName.textContent = urduFatherVal;
    }

    // 3. Gender
    if (genderInput && cardGender) {
      const g = genderInput.value;
      cardGender.textContent = g === 'Male' || g === 'M' ? 'M' : (g === 'Female' || g === 'F' ? 'F' : (g === 'Other' || g === 'O' ? 'O' : (g || 'M')));
    }

    // 4. Country of Stay
    if (countryInput && cardCountry) {
      cardCountry.textContent = countryInput.value.trim() || 'Pakistan';
    }

    // 5. Identity Number (CNIC)
    if (cnicInput && cardCnic) {
      cardCnic.textContent = cnicInput.value.trim() || '42101-1234567-1';
    }

    // 6. Date of Birth (strictly DD/MM/YYYY)
    if (dobInput && cardDob) {
      cardDob.textContent = dobInput.value ? formatDateString(dobInput.value) : '10/11/1987';
    }

    // 7. Date of Issue (strictly DD/MM/YYYY)
    if (cardIssueDate) {
      cardIssueDate.textContent = issueDateInput?.value ? formatDateString(issueDateInput.value) : formatDisplayDate(new Date());
    }

    // 8. Date of Expiry (strictly DD/MM/YYYY)
    if (cardExpiryDate) {
      if (expiryDateInput?.value) {
        cardExpiryDate.textContent = formatDateString(expiryDateInput.value);
      } else {
        const exp = new Date();
        exp.setFullYear(exp.getFullYear() + 10);
        cardExpiryDate.textContent = formatDisplayDate(exp);
      }
    }

    // 9. Profile Photo
    if (uploadedPhotoDataUrl) {
      renderCardPhoto(uploadedPhotoDataUrl);
    }

    // 10. Signature
    if (cardSignatureText) {
      const sigVal = signatureInput?.value.trim();
      if (sigVal) {
        cardSignatureText.textContent = sigVal;
      } else if (nameVal) {
        const parts = nameVal.split(/\s+/);
        cardSignatureText.textContent = parts.length > 1 ? `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}` : parts[0];
      }
    }

    // Visual pulse feedback
    if (idCard) {
      idCard.classList.remove('card-generate-feedback');
      void idCard.offsetWidth;
      idCard.classList.add('card-generate-feedback');
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateIdCard();
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateIdCard();
    });
  }

  // =========================================================================
  // 8. Robust html2canvas Download Functionality with Urdu Nastaliq Protection
  // =========================================================================

  document.getElementById('downloadBtn').addEventListener('click', async function() {
    const cardElement = document.getElementById('idCardPreview');
    if (!cardElement) return;

    // 1. Ensure custom Urdu fonts are fully loaded before rendering to prevent broken ligatures
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn('Font loading check completed with warning:', fontErr);
      }
    }
    
    html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        scale: 3, // High resolution export
        logging: false,
        backgroundColor: null,
        onclone: function(clonedDoc) {
            // Ensure Urdu text styles and ligatures are strictly preserved in the cloned canvas tree
            const urduElements = clonedDoc.querySelectorAll('.urdu-val, #cardUrduName, #cardUrduFatherName');
            urduElements.forEach(el => {
                el.style.fontFamily = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif";
                el.style.direction = "rtl";
                el.style.unicodeBidi = "isolate";
                el.style.letterSpacing = "normal";
                el.style.wordSpacing = "normal";
                el.style.fontFeatureSettings = '"liga" 1, "calt" 1';
                el.style.textAlign = "right";
                el.style.display = "inline-block";
            });
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'SmartID_Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error('Download failed:', err);
        alert('Could not download image. Try running via a local server or Live Server.');
    });
  });

  // =========================================================================
  // 9. Initial Load Setup
  // =========================================================================
  initializeAutomatedDates();
});
