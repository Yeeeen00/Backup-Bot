  let parsedData = [];
  let headers = [];
  let filteredRows = [];

  const fileInput = document.getElementById('fileInput');
  const authorInput = document.getElementById('authorName');
  const nameSelect = document.getElementById('nameSelect');
  const fontSizeInput = document.getElementById('fontSize');
  const authorBgInput = document.getElementById('authorBg');
  const selectedBgInput = document.getElementById('selectedBg');
  const responderTextColorInput = document.getElementById('responderTextColor');
  const authorTextColorInput = document.getElementById('authorTextColor');
  const replaceControls = document.getElementById('replace-controls');
    
  const fileName = document.getElementById('fileName');

  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files.length > 0
      ? fileInput.files[0].name
      : '선택된 파일 없음';
  });

  fileInput.addEventListener('change', e => {
    
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      headers = json[0];
      parsedData = json.slice(1);

      populateNameSelect();
      renderTable();
      renderChat();
    };
    reader.readAsArrayBuffer(file);
  });

  function populateNameSelect() {
    const nameIdx = headers.indexOf('이름');
    const authorName = authorInput.value.trim();

    const nameSet = new Set();
    parsedData.forEach(row => {
      const name = row[nameIdx];
      if (name && name !== authorName) {
        nameSet.add(name);
      }
    });

    nameSelect.innerHTML = '';
    nameSet.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      nameSelect.appendChild(option);
    });

    nameSelect.disabled = nameSet.size === 0;
  }

  authorInput.addEventListener('input', () => {
    filteredRows = [];  
    populateNameSelect();
    renderTable();
    renderChat();
  });

  nameSelect.addEventListener('change', () => {
    filteredRows = [];  
    renderTable();
    renderChat();
  });
  
  let editMode = false;

  document.getElementById("editToggleBtn").addEventListener("click", () => {
    editMode = !editMode;
    document.getElementById("editToggleBtn").textContent = editMode ? "수정 모드 끄기" : "수정 모드 켜기";
    replaceControls.style.display = editMode ? 'flex' : 'none';

    renderTable();
    });


  fontSizeInput.addEventListener('input', renderChat);
  authorBgInput.addEventListener('input', renderChat);
  selectedBgInput.addEventListener('input', renderChat);
  authorTextColorInput.addEventListener('input', renderChat);
  responderTextColorInput.addEventListener('input', renderChat);

  //테이블 추출
  function renderTable() {
    const nameIdx = headers.indexOf('이름');
    const commentIdx = headers.indexOf('댓글 내용');
    const output = document.getElementById('output');
    output.innerHTML = '';

    const authorName = authorInput.value.trim();
    const selectedName = nameSelect.value;

    // ✅ 수정된 조건: editMode 중이면 filteredRows 유지
    if ((!authorName || !selectedName) && (filteredRows.length === 0 || !editMode)) {
        filteredRows = [];
        return;
    }

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['이름', '댓글 내용'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        if(text == '이름') th.style.textAlign = 'center';
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //filter된 table이 없으면 row를 다시 불러옴
    if (filteredRows.length === 0) {

        filteredRows = [];
        let collecting = false;

        for (const row of parsedData) {
        const name = row[nameIdx];
        const comment = row[commentIdx] ?? '';

        if (!name) continue;

        if (!collecting && name === selectedName) {
            collecting = true;
        }

        if (collecting) {
            if (name !== selectedName && name !== authorName) break;
            filteredRows.push({ name, comment });
        }
        }
    }
    
    filteredRows.forEach((row, index) => {
    const tr = document.createElement('tr');

    // 이름 셀
    const nameTd = document.createElement('td');
    nameTd.style.textAlign = 'center';
    nameTd.style.whiteSpace = 'nowrap';
    nameTd.style.width = '1%';
    if (editMode) {
        const nameTextarea = document.createElement('textarea');
        nameTextarea.value = row.name;
        styleTextarea(nameTextarea);

        nameTextarea.className = 'table-name';

        nameTextarea.addEventListener('input', (e) => {
        filteredRows[index].name = e.target.value;
        autoResize(e.target);
        renderChat();  // 채팅창에도 반영
        });

      requestAnimationFrame(() => {
        autoResize(nameTextarea);
      });

        nameTd.appendChild(nameTextarea);

    } else {
        nameTd.textContent = row.name;
    }
    tr.appendChild(nameTd);

    // 댓글 셀
    const commentTd = document.createElement('td');
    if (editMode) {
        const commentTextarea = document.createElement('textarea');
        commentTextarea.value = row.comment;
        styleTextarea(commentTextarea);
        
        commentTextarea.addEventListener('input', (e) => {
        filteredRows[index].comment = e.target.value;
        autoResize(e.target);
        renderChat();
        });

      requestAnimationFrame(() => {
        autoResize(commentTextarea);
      });
        commentTd.appendChild(commentTextarea);
    } else {
        commentTd.textContent = row.comment;
    }
    tr.appendChild(commentTd);

    table.appendChild(tr);
    });


  output.appendChild(table);
}


// 🔧 보조 함수들
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';

  // 이름 셀에만 너비 자동 적용
  if (el.classList.contains('table-name')) {
    el.style.width = 'auto';
    el.style.width = (el.scrollWidth - 20) + 'px';
  }
}


function styleTextarea(textarea) {
  textarea.style.overflow = 'hidden';
  textarea.style.resize = 'none';
}

  function renderChat() { //채팅 출력
    const chatOutput = document.getElementById('chatOutput');
    chatOutput.innerHTML = '';

    const authorName = authorInput.value.trim();
    const fontSize = fontSizeInput.value.trim() || '14px';
    const authorBg = authorBgInput.value || '#FFFFFF';
    const selectedBg = selectedBgInput.value || '#D6D6D6';
    const authorTextColor = authorTextColorInput.value || '#0A0A0A';
    const responderTextColor = responderTextColorInput.value || '#0A0A0A';


    filteredRows.forEach(({ name, comment }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-wrapper ' + (name === authorName ? 'left' : 'right');

      const bubble = document.createElement('div');
      bubble.className = 'chat-message';
      bubble.style.fontSize = fontSize;
      bubble.style.backgroundColor = (name === authorName) ? authorBg : selectedBg;
      bubble.style.color = (name === authorName) ? authorTextColor : responderTextColor;

      const author = document.createElement('div');
      author.className = 'chat-author';
      author.textContent = name;

      const content = document.createElement('div');
      content.textContent = comment;

      bubble.appendChild(author);
      bubble.appendChild(content);
      wrapper.appendChild(bubble);
      chatOutput.appendChild(wrapper);
    });
  }

  document.getElementById("saveChatBtn").addEventListener("click", () => {
  // 1. chat-area HTML 내용 가져오기
  const chatHtml = document.querySelector(".chat-area").outerHTML;

  // 2. 동적 스타일 값 가져오기
    const authorName = authorInput.value.trim();
    const fontSize = fontSizeInput.value.trim() || '14px';
    const authorBg = authorBgInput.value || '#FFFFFF';
    const responderBg = selectedBgInput.value || '#D6D6D6';
    const authorTextColor = authorTextColorInput.value || '#0A0A0A';
    const responderTextColor = responderTextColorInput.value || '#0A0A0A';

  // 3. HTML 템플릿 만들기
  const fullHtml = `
    `;

    fetch('example.txt')
        .then(res => res.text())
        .then(text => {
            // 템플릿 내에서 {{변수명}} 같은 형식으로 치환
            const filled = text
                .replace('${fontSize}', fontSize)
                .replace('${authorBg}', authorBg)
                .replace('${authorTextColor}', authorTextColor)
                .replace('${responderBg}', responderBg)
                .replace('${responderTextColor}', responderTextColor)
                .replace('${chatHtml}', chatHtml);
            const blob = new Blob([filled], { type: "text/html" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "chat.html";
            link.click();
    });
});


document.getElementById('replaceAllBtn').addEventListener('click', () => {
  const find = document.getElementById('findValue').value;
  const replace = document.getElementById('replaceValue').value;

  if (!find) return;

  // filteredRows에 대해 find → replace 적용
  filteredRows = filteredRows.map(row => {
    const newName = row.name.replaceAll(find, replace);
    const newComment = row.comment.replaceAll(find, replace);
    return { name: newName, comment: newComment };
  });

  renderTable();  // 테이블 업데이트
  renderChat();   // 채팅 출력도 새로고침
});