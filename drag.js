let isDragging = false;

let shiftX, shiftY;

 /* ------------------------------------------------------ Функция перемещения элемента ------------------------------------------------------- */

function moveAt(dragElement, clientX, clientY) {
  // вычисляем новые координаты (относительно окна)
  let newX = clientX - shiftX;
  let newY = clientY - shiftY;

  // проверяем, не переходят ли новые координаты за нижний край окна:
  // сначала вычисляем гипотетический новый нижний край окна
  let newBottom = newY + dragElement.offsetHeight;

  // затем, если новый край окна выходит за пределы документа, прокручиваем страницу
  if (newBottom > document.documentElement.clientHeight) {
    // координата нижнего края документа относительно окна
    let docBottom = document.documentElement.getBoundingClientRect().bottom;

    // простой скролл документа на 10px вниз имеет проблему -
    // он может прокручивать документ за его пределы,
    // поэтому используем Math.min(расстояние до конца, 10)
    let scrollY = Math.min(docBottom - newBottom, 10);

    // вычисления могут быть не совсем точны - случаются ошибки при округлении,
    // которые приводят к отрицательному значению прокрутки. отфильтруем их:
    if (scrollY < 0) scrollY = 0;

    window.scrollBy(0, scrollY);

    // быстрое перемещение мыши может поместить курсор за пределы документа вниз
    // если это произошло -
    // ограничиваем новое значение Y максимально возможным исходя из размера документа:
    newY = Math.min(newY, document.documentElement.clientHeight - dragElement.offsetHeight);
  }

  // проверяем, не переходят ли новые координаты за верхний край окна (по схожему алгоритму)
  if (newY < 0) {
    // прокручиваем окно вверх
    let scrollY = Math.min(-newY, 10);
    if (scrollY < 0) scrollY = 0; // проверяем ошибки точности

    window.scrollBy(0, -scrollY);
    // быстрое перемещение мыши может поместить курсор за пределы документа вверх
    newY = Math.max(newY, 0); // newY не может быть меньше нуля
  }


  // ограничим newX размерами окна
  // согласно условию, горизонтальная прокрутка отсутствует, поэтому это не сложно:
  if (newX < 0) newX = 0;
  if (newX > document.documentElement.clientWidth - dragElement.offsetWidth) {
    newX = document.documentElement.clientWidth - dragElement.offsetWidth;
  }

  dragElement.style.left = newX + 'px';
  dragElement.style.top = newY + 'px';
}

/*------------------------------------------ Проверка является ли девайс сенсорным ----------------------------------------------- */

function isTouchDevice(){
  return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

if(isTouchDevice()===true) {
  //alert('Touch Device'); 

        /* ---------------------------------- Остановка и возобновление прокрутки для тач-экранов---------------------------------- */
        
        function disableScroll() {
          // Получить текущую позицию прокрутки страницы
          scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
              // при попытке прокрутки установить это значение на предыдущее
              window.onscroll = function() {
                  window.scrollTo(scrollLeft, scrollTop);
              };
        }

        function enableScroll() {
          window.onscroll = function() {};
        }   
        
        /* ------------------------------------------- Реализация двойного тапа для тач-скрина (работает не очень корректно)------------------------------- */
        
        let clickTimer = null;

        function dblTap() {
            if (clickTimer == null) {
                clickTimer = setTimeout(function () {
                    clickTimer = null;
                    //alert("single"); //одиночное нажатие
                }, 500)
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                //alert("double"); // двойное нажатие
                return true;
            }
        }
        
        let longtouch;
        let timer;
        let touchduration = 1000;

        /* ---------------------------------------------- События для тач-скрина --------------------------------------- */
        
        document.addEventListener('touchstart', function(event) {

          let dragElement = event.touches[0].target.closest('.draggable');
          if (!dragElement) return;
          
          dragElement.ondragstart = function() {
              return false;
          };
          disableScroll(); // Выключаем прокрутку страницы

          longtouch = false;

          /*----------------Реализация длинного тапа --------------- */
          
          timer = setTimeout(function() {
            longtouch = true;
            timer = null
          }, touchduration);

          /*if (dblTap()) {                                                       // функция выполняется при двойном тапе на объект
              document.querySelector('.toggle').classList.toggle('active');
              document.querySelector('.dragNavigation').classList.toggle('active');
          };*/

          startTouchDrag(dragElement, event.touches[0].clientX, event.touches[0].clientY);

          function onTouchUp(event) {
            enableScroll(); // Включаем прокрутку страницы
            
            /* ------ Действия при долгом тапе-------------------- */
            if (timer) {
              clearTimeout(timer);
            }
            if (longtouch) {
                document.querySelector('.toggle').classList.toggle('active');
                document.querySelector('.dragNavigation').classList.toggle('active');
                longtouch = false;
            }
            
            finishTouchDrag();
          };

          function onTouchMove(event) {
            moveAt(dragElement, event.touches[0].clientX, event.touches[0].clientY);
          }

          // в начале перемещения элемента:
          //   запоминаем место клика по элементу (shiftX, shiftY),
          //   переключаем позиционирование элемента (position:fixed) и двигаем элемент
          function startTouchDrag(element, clientX, clientY) {
            if(isDragging) {
              return;
            }

            isDragging = true;

            document.addEventListener('touchmove', onTouchMove);
            element.addEventListener('touchend', onTouchUp);

            shiftX = clientX - element.getBoundingClientRect().left;
            shiftY = clientY - element.getBoundingClientRect().top;

            element.style.position = 'fixed';

            moveAt(element, clientX, clientY);
          };

          // переключаемся обратно на абсолютные координаты
          // чтобы закрепить элемент относительно документа
          function finishTouchDrag() {
            if(!isDragging) {
              return;
            }

            isDragging = false;

            //dragElement.style.top = parseInt(dragElement.style.top) + pageYOffset + 'px';
            //dragElement.style.position = 'absolute';

            dragElement.style.position = 'fixed'; //Для нахождения на одном месте на экране при скролле. Закоментировать две верхние строки

            document.removeEventListener('touchmove', onTouchMove);
            dragElement.removeEventListener('touchend', onTouchUp);
          }
        });

}/*------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
else {
  //alert('Not a Touch Device'); 

      /* ---------------------- События для мыши --------------------------------- */
      
      document.addEventListener('mousedown', function(event) {

        let dragElement = event.target.closest('.draggable');
    
        if (!dragElement) return;
    
        event.preventDefault();
        
        dragElement.ondragstart = function() {
            return false;
        };
    
        startDrag(dragElement, event.clientX, event.clientY);
    
        function onMouseUp(event) {
          finishDrag();
        };
    
        function onMouseMove(event) {
          moveAt(dragElement, event.clientX, event.clientY);
        }
    
        // в начале перемещения элемента:
        //   запоминаем место клика по элементу (shiftX, shiftY),
        //   переключаем позиционирование элемента (position:fixed) и двигаем элемент
        function startDrag(element, clientX, clientY) {
          if(isDragging) {
            return;
          }
    
          isDragging = true;
    
          document.addEventListener('mousemove', onMouseMove);
          element.addEventListener('mouseup', onMouseUp);
    
          shiftX = clientX - element.getBoundingClientRect().left;
          shiftY = clientY - element.getBoundingClientRect().top;
    
          element.style.position = 'fixed';
    
          moveAt(element, clientX, clientY);
        };
    
        // переключаемся обратно на абсолютные координаты
        // чтобы закрепить элемент относительно документа
        function finishDrag() {
          if(!isDragging) {
            return;
          }
    
          isDragging = false;
    
          //dragElement.style.top = parseInt(dragElement.style.top) + pageYOffset + 'px';
          //dragElement.style.position = 'absolute';
    
          dragElement.style.position = 'fixed'; //Для нахождения на одном месте на экране при скролле. Закоментировать две верхние строки
    
          document.removeEventListener('mousemove', onMouseMove);
          dragElement.removeEventListener('mouseup', onMouseUp);
        }
      });
}