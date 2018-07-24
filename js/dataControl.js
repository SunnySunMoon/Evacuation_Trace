//控制数据帧
class Controller { 
  constructor (domId, data = [], fq = 200) {
    this.data = data;
    this.fq = fq;
    this.rootDom = document.getElementById(domId);
    this.loadTo(0); //默认从第一帧数据开始
    this._current = 0; 
    this.timer = 0; //定时器
  }
  get current() {
    return this._current;
  }
  set current(newValue) {
    this._current = newValue;
  }
  //注册插件
  registerPlugins (...plugins) {
    plugins.forEach(plugin => {
      const pluginContainer = document.createElement('div');
      pluginContainer.className = 'controller__plugin';
      //渲染插件，内容由插件自身定义
      pluginContainer.innerHTML = plugin.render();
      this.rootDom.appendChild(pluginContainer);
      //注入插件脚本逻辑
      plugin.action(this);
    });
  }
  //获取当前数据帧
  getCurrentFrame () {
    const current = this.data[this.current];
    return current; 
  }
  //获取当前数据帧的下标
  getCurrentIdx () {
    return this.current; 
  }
  //跳转到对应数据帧
  loadTo (idx) {
    this.current = idx;
    return this.data[this.current];
  }
  //跳转到下一帧数据
  loadNext () {
    if (this.current == this.data.length-1) {
      alert('已经是最后一帧!');
      return ;
    }
    this.current++;
    return this.data[this.current];
  }
  //跳转到前一帧数据
  loadPrevious () {
    if(this.current == 0) {
      alert('已经是第一帧!');
      return ;
    }
    this.current--;
    return this.data[this.current];
  }
}

//上一帧
const pluginPrevious = {
  render () {
    return `<button class="controller__button--previous"> Previous </button>`
  },
  action (controller) {
    let previous = controller.rootDom.querySelector('.controller__button--previous');
    if (previous) {
      previous.addEventListener('click', evt => {
        clearInterval(timer);
        buildingMap.drawFrame(controller.loadPrevious());
      });
    }
  }
}
//下一帧
const plugiNext = {
  render () {
    return `<button class="controller__button--next"> Next </button>`
  },
  action (controller) {
    let next = controller.rootDom.querySelector('.controller__button--next');
    if (next) {
      next.addEventListener('click', evt => {
        clearInterval(timer);
        buildingMap.drawFrame(controller.loadNext());
      });
    }
  }
}
//开始播放
const pluginStart = {
  render () {
    return `<button class="controller__button--start"> Start </button>`
  },
  action (controller) {
    let start = controller.rootDom.querySelector('.controller__button--start');
    if (start) {
      start.addEventListener('click', evt => {
        buildingMap.drawFrame(controller.getCurrentFrame());
        controller.timer = setInterval(() => {
          if (controller.getCurrentIdx() != controller.data.length - 1) {
            buildingMap.drawFrame(controller.loadNext());
          } else {
            clearInterval(controller.timer);
          }
        }, controller.fq);
      })
    }
  }
}
//进度条
const pluginProcessBar = {
  offset: 0,
  render () {
    return `<div class="controller__processBar">
      <div class="processBar--past"></div>
      <div class="processBar--ahead"></div>
      <span class="processBar--slider"></span>  
    </div>`
  },
  action (controller) {
    let processBar = controller.rootDom.querySelector('.controller__processBar'), 
      past = controller.rootDom.querySelector('.processBar--past'),
      ahead = controller.rootDom.querySelector('.processBar--ahead'),
      slider = controller.rootDom.querySelector('.processBar--slider');
      let drag = false;
    if (slider) {
      //鼠标进度条点击跳转
      processBar.addEventListener('click', evt => {
        console.log(evt.clientX)
        this.offset = evt.clientX - processBar.offsetLeft - 10;
        slider.style.left = this.offset + 'px';
        past.style.width = this.offset + 'px';
        ahead.style.width = 1000 - this.offset + 'px';
        
        let idx = this.offset/1000 * controller.data.length;
        idx = Math.ceil(idx);
        buildingMap.drawFrame(controller.loadTo(idx-1));
      });
      //滑块拖动跳转
      slider.addEventListener('mousedown', evt => {
        evt.stopPropagation();
        drag = true;
      });
      document.addEventListener('mouseup', evt => {
        drag = false;
      })
      processBar.addEventListener('mousemove', evt => {
        if (drag && evt.clientX >= 40 && evt.clientX <= 1030) {
          this.offset = evt.clientX - processBar.offsetLeft - 10;
          slider.style.left = this.offset + 'px';
          past.style.width = this.offset + 'px';
          ahead.style.width = 1000 - this.offset + 'px';

          let idx = this.offset/1000 * controller.data.length;
          idx = Math.ceil(idx);
          buildingMap.drawFrame(controller.loadTo(idx-1));
        }
      });
      // processBar.addEventListener('mouseup', evt => {
      //   let idx = this.offset/1000 * controller.data.length;
      //   idx = Math.ceil(idx);
      //   buildingMap.drawFrame(controller.loadTo(idx-1));
      // })
    }
  }
}