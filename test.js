const { Builder, By, until } = require('selenium-webdriver');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeSlowly(element, text, delay = 100) {
  for (let char of text) {
    await element.sendKeys(char);
    await sleep(delay);
  }
}


(async function testRedirectIfNotLoggedIn() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:5173/dashboard');

    // Đợi redirect nếu chưa login
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/login') || url.includes('/dashboard');
    }, 15000);

    const currentUrl = await driver.getCurrentUrl();

    if (currentUrl.includes('/login')) {
      console.log("\n--------------------------------------------------------------");

      console.log('Redirect hoạt động: Chuyển hướng về /login nếu chưa đăng nhập.');

      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await typeSlowly(emailInput, 'user@gmail.com');

      const passwordInput = await driver.findElement(By.css('input[type="password"]'));
      await typeSlowly(passwordInput, '123');

      const loginBtn = await driver.findElement(By.css('button[type="submit"]'));
      await loginBtn.click();

      // Đợi chuyển đến dashboard sau khi login
      await driver.wait(until.urlContains('/dashboard'), 15000);

      const afterLoginUrl = await driver.getCurrentUrl();

      if (afterLoginUrl.includes('/dashboard')) {
        console.log('Đăng nhập thành công và chuyển tới dashboard.');
  
        // Đợi menu xuất hiện để đảm bảo dashboard đã load xong
        await driver.wait(until.elementLocated(By.id('menu_1')), 10000);
        await sleep(2000); // chờ thêm cho chắc
      } else {
        console.log('Không chuyển đến dashboard sau khi đăng nhập.');
        return;
      }

    } else if (currentUrl.includes('/dashboard')) {
      console.log("\n--------------------------------------------------------------");

      console.log('Đã đăng nhập sẵn, truy cập dashboard thành công.');
      await driver.wait(until.elementLocated(By.id('menu_1')), 10000);
      await sleep(2000);
    } else {
      console.log(`URL không hợp lệ sau khi truy cập: ${currentUrl}`);
      return;
    }

    // ================== TEST SIDE_MENU ==================
    console.log("\n--------------------------------------------------------------");
    const menus = [
      { id: 'menu_1', url: 'http://localhost:5173/income' },
      { id: 'menu_2', url: 'http://localhost:5173/expense' },
      { id: 'menu_3', url: 'http://localhost:5173/note' }
    ];

    for (const menu of menus) {
      console.log(`Đang kiểm tra menu ${menu.id}`);

      // Đảm bảo button tồn tại
      const btn = await driver.wait(until.elementLocated(By.id(menu.id)), 10000);
      await btn.click();

      // Chờ url đúng sau khi click
      await driver.wait(until.urlIs(menu.url), 10000);
      const current = await driver.getCurrentUrl();

      if (current === menu.url) {
        console.log(`Click ${menu.id} chuyển đúng sang ${current}\n`);
      } else {
        console.log(`--Click ${menu.id} nhưng đang ở ${current}\n`);
      }

      // Quay lại dashboard trước khi kiểm tra menu tiếp theo
      // await driver.get('http://localhost:5173/dashboard');
      // await driver.wait(until.elementLocated(By.id('menu_1')), 10000);
      await sleep(3000);
    }



    // ================================================ TEST INCOME PAGE =================================================
    console.log("\n--------------------------------------------------------------");

    await driver.wait(until.elementLocated(By.id('menu_1')), 10000);
    await driver.get('http://localhost:5173/income');
    await sleep(3000);


    // ---------------------test thêm mới thành công----------------------

    // Mở form thêm income
    const openFormBtn = await driver.findElement(By.id('btn_open_frIncome'));
    await openFormBtn.click();
    await sleep(2000); // chờ form mở

    // Click chọn icon 
    const pickerIcon = await driver.findElement(By.css('.flex.items-center.gap-4.cursor-pointer'));
    await pickerIcon.click();
    await sleep(2000);

    const iconSelector = await driver.wait(until.elementLocated(By.css('button[data-unified="1f4b0"]')), 10000);
    await iconSelector.click();
    await sleep(1000); 

    const closePicker = await driver.findElement(By.id("close_picker"));
    await closePicker.click();
    await sleep(1000)
    

    // Điền input source
    const sourceInput = await driver.findElement(By.css('input[type="text"]'));
    await typeSlowly(sourceInput, 'Lương tháng 4');

    // Điền input amount (số tiền)
    const amountInput = await driver.findElement(By.css('input[type="number"]'));
    await typeSlowly(amountInput, '10000000');

    // Chọn ngày
    const dateInput = await driver.findElement(By.css('input[type="date"]'));
    await dateInput.clear(); // Xoá trước
    await dateInput.sendKeys('05/18/2025');

    // Click nút Thêm
    const submitBtn = await driver.findElement(By.id('add_income'));
    await submitBtn.click();

    console.log("Đang kiểm tra thêm mới khoản thu thành công: ");
    try {
      const toastSuccess = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Thêm khoản thu thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);

    // ---------------------test thêm mới không nhập đủ dữ liệu----------------------
    const openFormBtn2 = await driver.findElement(By.id('btn_open_frIncome'));
    await openFormBtn2.click();
    await sleep(2000);

    // add mà không nhập source
    const submitBtn2 = await driver.findElement(By.id('add_income'));
    await submitBtn2.click();
    sleep(1000);

    console.log("Đang kiểm tra nguồn thu không để trống: ");
    try {
      const toastSourceEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Nguồn thu không được để trống')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(2000);

    // nhập soruce nhưng không nhập amount
    const sourceInput2 = await driver.findElement(By.css('input[type="text"]'));
    await sourceInput2.clear();
    await typeSlowly(sourceInput2, 'Đầu tư');

    await submitBtn2.click();
    await sleep(1000);

    console.log("Đang kiểm tra số tiền không để trống: ");
    try {
      const toastAmountEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Số tiền không hợp lệ')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(2000);

    // có source + nhập amount
    const amountInput3 = await driver.findElement(By.css('input[type="number"]'));
    await typeSlowly(amountInput3, '5000000');

    await submitBtn2.click();
    await sleep(1000);

    console.log("Đang kiểm tra số ngày thêm để trống: ");
    try {
      const toastDateEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Ngày thêm không được để trống')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(2000);

    // có source có amount + nhập date
    const dateInput2 = await driver.findElement(By.css('input[type="date"]'));
    await dateInput2.clear(); 
    await dateInput2.sendKeys('05/17/2025');

    await submitBtn2.click();
    await sleep(4000);

    // ---------------------test thêm mới mở form rồi đóng form----------------------
    console.log("Đang kiểm tra số mở form rồi đóng form: ");
    try {
      const openFormBtn5 = await driver.findElement(By.id('btn_open_frIncome'));
      await openFormBtn5.click();
      await sleep(2000);
      const closeFormBtn5 = await driver.findElement(By.id('close_modal'));
      await closeFormBtn5.click();
      await sleep(2000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);


    // ---------------------------xóa income----------------------
    const deleteBtn = await driver.findElement(By.xpath("//div[@class='grid grid-cols-1 gap-6']//div[1]//div[2]//div[2]//button[1]"));
    await deleteBtn.click();
    await sleep(2000);

    const deleteIncome = await driver.findElement(By.id("delete"));
    await deleteIncome.click();
    await sleep(2000);

    console.log("Đang kiểm tra xóa khoản thu thành công: ");
    try {
      const toastDeleteIncomSuc = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Xóa khoản thu thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);

    // ---------- chọn xóa sau đó chọn hủy -----------
    console.log("Đang kiểm tra chọn xóa khoản thu nhưng sau đó hủy xóa: ");
    try {
      const deleteBtn2 = await driver.findElement(By.xpath("//div[@class='grid grid-cols-1 gap-6']//div[1]//div[2]//div[2]//button[1]"));
      await deleteBtn2.click();
      await sleep(2000);

      const closeFormBtn6 = await driver.findElement(By.id('close_modal'));
      await closeFormBtn6.click();
      await sleep(2000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);

    //---download income----
    console.log("Đang kiểm tra tải về chi tiết khoản thu: ");

    const btnDownloadIncome = await driver.findElement(By.id("download_income"));
    btnDownloadIncome.click();
    await sleep(2000);

    try {
      const toastDeleteIncomSuc = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Tải xuống chi tiết khoản thu thành công!')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);



    // ================================================== TEST EXPENSE PAGE ==========================================================
    console.log("\n--------------------------------------------------------------");

    await driver.wait(until.elementLocated(By.id('menu_2')), 10000);
    await driver.get('http://localhost:5173/expense');
    await sleep(3000);


    // ---------------------test thêm mới thành công----------------------

    // Mở form thêm income
    const openFormExpenseBtn = await driver.findElement(By.id('btn_open_frExpense'));
    await openFormExpenseBtn.click();
    await sleep(2000); // chờ form mở

    // Click chọn icon 
    const pickerIcon2 = await driver.findElement(By.css('.flex.items-center.gap-4.cursor-pointer'));
    await pickerIcon2.click();
    await sleep(2000);

    const iconSelector2 = await driver.wait(until.elementLocated(By.css('button[data-unified="1f3e0"]')), 10000);
    await iconSelector2.click();
    await sleep(1000); 

    const closePicker2 = await driver.findElement(By.id("close_picker"));
    await closePicker2.click();
    await sleep(1000)
    

    // Điền input source
    const categoryInput = await driver.findElement(By.css('input[type="text"]'));
    await typeSlowly(categoryInput, 'Thuê nhà');

    // Điền input amount (số tiền)
    const amountInputExpense = await driver.findElement(By.css('input[type="number"]'));
    await typeSlowly(amountInputExpense, '4000000');

    // Chọn ngày
    const dateInputExpense = await driver.findElement(By.css('input[type="date"]'));
    await dateInputExpense.clear(); // Xoá trước
    await dateInputExpense.sendKeys('05/18/2025');

    // Click nút Thêm
    const submitBtnExpense = await driver.findElement(By.id('add_expense'));
    await submitBtnExpense.click();

    console.log("Đang kiểm tra thêm mới chi tiêu thành công: ");
    try {
      const toastSuccess = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Thêm khoản chi thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);

    // ---------------------test thêm mới không nhập đủ dữ liệu----------------------
    const openFormExpenseBtn2 = await driver.findElement(By.id('btn_open_frExpense'));
    await openFormExpenseBtn2.click();
    await sleep(2000);

    // add mà không nhập source
    const submitBtnExpense2 = await driver.findElement(By.id('add_expense'));
    await submitBtnExpense2.click();
    sleep(1000);

    console.log("Đang kiểm tra nguồn chi không để trống: ");
    try {
      const toastCategoryEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Khoản chi không được để trống')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(2000);

    // nhập soruce nhưng không nhập amount
    const categoryInput2 = await driver.findElement(By.css('input[type="text"]'));
    await categoryInput2.clear();
    await typeSlowly(categoryInput2, 'Mua áo');

    await submitBtnExpense2.click();
    await sleep(1000);

    console.log("Đang kiểm tra số tiền không để trống: ");
    try {
      const toastAmountEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Số tiền không hợp lệ')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(2000);

    // có source + nhập amount
    const amountInputExpense2 = await driver.findElement(By.css('input[type="number"]'));
    await typeSlowly(amountInputExpense2, '400000');

    await submitBtnExpense2.click();
    await sleep(1000);

    console.log("Đang kiểm tra số ngày thêm để trống: ");
    try {
      const toastDateEmpty = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Ngày chi không được để trống')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(2000);

    // có source có amount + nhập date
    const dateInputExpense2 = await driver.findElement(By.css('input[type="date"]'));
    await dateInputExpense2.clear(); // Xoá trước
    await dateInputExpense2.sendKeys('05/17/2025');

    await submitBtnExpense2.click();
    await sleep(4000);

    // ---------------------test thêm mới mở form rồi đóng form----------------------
    console.log("Đang kiểm tra số mở form rồi đóng form: ");
    try {
      const openFormExpenseBtn3 = await driver.findElement(By.id('btn_open_frExpense'));
      await openFormExpenseBtn3.click();
      await sleep(2000);
      const closeFormBtnExpense3 = await driver.findElement(By.id('close_modal'));
      await closeFormBtnExpense3.click();
      await sleep(2000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);

    // ---------------------------xóa income----------------------
    const deleteBtnExpense = await driver.findElement(By.xpath("//div[@class='grid grid-cols-1 gap-6']//div[1]//div[2]//div[2]//button[1]"));
    await deleteBtnExpense.click();
    await sleep(2000);

    const deleteExpense = await driver.findElement(By.id("delete"));
    await deleteExpense.click();
    await sleep(2000);

    console.log("Đang kiểm tra xóa khoản chi thành công: ");
    try {
      const toastDeleteExpenseSuc = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Xóa khoản chi thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);

    // ---------- chọn xóa sau đó chọn hủy -----------
    console.log("Đang kiểm tra chọn xóa khoản chi nhưng sau đó hủy xóa: ");
    try {
      const deleteBtnExpense2 = await driver.findElement(By.xpath("//div[@class='grid grid-cols-1 gap-6']//div[1]//div[2]//div[2]//button[1]"));
      await deleteBtnExpense2.click();
      await sleep(2000);

      const closeFormBtnExpense = await driver.findElement(By.id('close_modal'));
      await closeFormBtnExpense.click();
      await sleep(2000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);


    //---download exense----
    console.log("Đang kiểm tra tải về chi tiết khoản thu: ");

    const btnDownloadExpense = await driver.findElement(By.id("download_expense"));
    btnDownloadExpense.click();
    await sleep(2000);

    try {
      const toastDeleteIncomSuc = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Tải xuống chi tiết khoản tiêu thành công!')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);  



  // ========================================== TEST NOTE PAGE ======================================================
    console.log("\n--------------------------------------------------------------");
    await driver.wait(until.elementLocated(By.id('menu_3')), 10000);
    await driver.get('http://localhost:5173/note');
    await sleep(3000);

    // ---- thêm mới note----
    const btnAddNote = await driver.findElement(By.id("add-note"));
    btnAddNote.click();
    await sleep(2000);

    const inputTitle = await driver.findElement(By.id("title"));
    await typeSlowly(inputTitle, 'Chạy bộ');
    await sleep(1000);
    
    const textContent = await driver.findElement(By.id("content"));
    await typeSlowly(textContent, 'Chạy bộ 5km');
    await sleep(1000);

    const inputTags = await driver.findElement(By.id("tags"));
    await typeSlowly(inputTags, 'Chạy');
    await sleep(1000);

    const btnAddTag = await driver.findElement(By.id("add-tag"));
    await btnAddTag.click();
    await sleep(2000);

    const btnSubmit = await driver.findElement(By.id("btnAddNote"));
    btnSubmit.click();
    await sleep(1000);

    console.log("Đang kiểm tra thêm mới ghi chú thành công: ");
    try {
      const toastSuccess = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Thêm ghi chú thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);

    // -----tìm kiếm------
    console.log("Đang kiểm tra tìm kiếm ghi chú: ");
    try {
      const inputSearchNote = await driver.findElement(By.id("search-note"));
      await typeSlowly(inputSearchNote, 'Chạy bộ');
      await sleep(1000);

      const btnSearchNote = await driver.findElement(By.id("btn-search-note"));
      btnSearchNote.click();
      await sleep(4000);

      const btnClearSearchNote = await driver.findElement(By.id("btn-delete-search"));
      btnClearSearchNote.click();
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);
    
    // ghim
    console.log("Đang kiểm tra ghim/bỏ ghim ghi chú: ");
    try {
      const pinnedBtn = await driver.findElement(By.xpath("//body/div[@id='root']/div/div/div/div[@class='flex']/div[@class='grow mx-5']/div[@class='my-5 mx-auto']/div/div[@id='list-notes']/div[3]/div[1]//*[name()='svg']"));
      await pinnedBtn.click();
      await sleep(2000);  
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(3000);

    // -----cập nhật------
    const editBtn = await driver.findElement(By.xpath("//div[@id='list-notes']//div[1]//div[2]//div[2]//*[name()='svg']//*[name()='path' and contains(@d,'M3 17.25V2')]"));
    await editBtn.click();
    await sleep(2000);  

    const inputTitleEdit = await driver.findElement(By.id("title"));
    inputTitleEdit.clear();
    await typeSlowly(inputTitleEdit, 'EDIT: Chạy bộ');
    await sleep(1000);
    
    const btnConfirmEdit = await driver.findElement(By.id("btnAddNote"));
    btnConfirmEdit.click();
    await sleep(1000);

    console.log("Đang kiểm tra chỉnh sửa ghi chú thành công: ");
    try {
      const toastSuccess = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Cập nhật ghi chú thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }
    await sleep(4000);


    // ------xóa------
    const deleteBtnNote = await driver.findElement(By.xpath("//div[@id='list-notes']//div[1]//div[2]//div[2]//*[name()='svg']//*[name()='path' and contains(@d,'M6 19c0 1.')]"));
    await deleteBtnNote.click();
    await sleep(2000);

    const deleteNote = await driver.findElement(By.id("delete"));
    await deleteNote.click();
    await sleep(2000);

    console.log("Đang kiểm tra xóa ghi chú thành công: ");
    try {
      const toastDeleteExpenseSuc = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Xóa ghi chú thành công')]")), 5000);
      console.log("Thành công\n");
    } catch (error) {
      console.log("Thất bại\n");
    }

    await sleep(4000);


    //================================LOG OUT============================
    console.log("\n--------------------------------------------------------------");
    await driver.wait(until.elementLocated(By.id('menu_4')), 10000);
    const btnLogout = driver.findElement(By.id("menu_4"));
    btnLogout.click();
    await sleep(4000);


  } catch (error) {
    console.error('Có lỗi xảy ra:', error);
  } finally {
    await driver.quit();
  }
})();
