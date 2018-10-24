/*
* 本脚本定义了Canvas的子类Stain，并进一步定义继承自Stain的空域、时域染色类
* 数据data为帧数据，因此data.length就是总帧数，
* data[0].length就是每帧的总数据点数 
*/

 class Stain extends Canvas {
  //构造函数，声明实例属性，绑定染色图层事件
  constructor (id, data, action=null) {
    super(id);
    this.data = data;
    this.action = action; //未知的数据操作函数
    this.length	= data[0].length; //总帧数
    this.isStainMode = false; //染色开关
    this.dragStatus = false;  //拖拽状态
    this.stainArea = [];  //存放染色区域对象
    this.dataColor = new Array(data.length) .fill('white');
    this.allIds = [];  //记录所有染色区域中存在的对象的唯一标识
    this.listDom = null;  //用于显示染色对象的DOM
    this.objects = []; //记录染色对象信息

    //监听鼠标按钮按下事件，记录染色区域起始位置
    this.canvas.addEventListener('mousedown', e => {
      if (this.isStainMode) {
        this.dragStatus = true;
        //statusArr继承自Canvas,存放操作初始时imageData绘图状态
        this.statusArr.push(this.saveData());
        let area = {
          start: null,
          end: null,
          color: '', //染色区域的背景颜色
          ids: [],
        } 
        this.stainArea.push(area);
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        this.setStartOfArea(loc, area); //设置本次染色区域的起始位置信息
      }
    });
    //监听鼠标移动事件，不断记录鼠标当前位置并调用框选绘制函数
    this.canvas.addEventListener('mousemove', e => {
      if (this.isStainMode && this.dragStatus) {
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        //设置本次染色区域的终止位置信息
        this.setEndOfArea(loc, this.stainArea[this.stainArea.length-1]);
        this.restoreData();
        //绘制染色区域框选效果
        this.drawStainArea(this.stainArea[this.stainArea.length-1]);
      }
    });
    //监听鼠标按钮抬起事件、移出事件，结束框选并调用数据点染色函数
    this.canvas.addEventListener('mouseup', e => {
      this.dragStatus = false;
      this.stainDataPoints();
    });
    this.canvas.addEventListener('mouseout', e => {
      if (this.dragStatus === true) {
        this.dragStatus = false;
        this.stainDataPoints();
      }
    });
  }

  //#region start 实例方法

  //对符合条件的数据点进行染色
  stainDataPoints () {
    let area = this.stainArea[this.stainArea.length - 1];
    this.getQualified(area); //获得符合条件的数据点信息
    if (this.action) {
      this.action(this.dataColor);
      this.allIds = this.allIds.concat(area.ids);
    }
    this.createObjectsList();
  }
  //绑定染色开关按钮
  bindStain (dom) {
    dom.addEventListener('click', e => {
      this.isStainMode = true;
      this.canvas.style.display	= 'block';
      this.canvas.style.zIndex = '2';
    });
  }
  //绑定退出染色按钮
  bindExit (dom) {
    dom.addEventListener('click', e => {
      this.isStainMode = false;
      //以下操作是为了保证原图层一些显示、功能不被染色图层给遮盖
      this.canvas.style.display = 'none'; //若一个染色区也不存在，则整个隐藏
    });
  }
  //绑定撤销按钮
  bindUndo (dom) {
    dom.addEventListener('click', e => {
      //先还原原图层的数据（染色点数据）
      const data = this.statusArr.pop();
      if (data != undefined) {
        this.imageData = data;
        this.restoreData();
        const ids = this.stainArea.pop().ids;
        ids.forEach(x => {
          let index = this.allIds.indexOf(x);
          this.allIds.splice(index, 1); //删除一次
          if (!this.allIds.includes(x)) {
            //确定该号码在剩余的区域中不存在
            this.dataColor[x] = 'white';
          }
        });
        //如果存在操作函数
        if (this.action) {
          this.action(this.dataColor); //以染色名单为参数执行操作
        }
        this.createObjectsList(); //创建染色对象名单
      }
    })
  }
  //绑定清空按钮
  bindEmpty (dom) {
    dom.addEventListener('click', e => {
      let originImageData = this.statusArr[0];
      this.statusArr = []; //清空历史状态数组
      this.stainArea = []; //清空染色区域数组
      this.allIds = []; //清空染色对象id数组
      this.imageData = originImageData;
      if (originImageData != undefined) {
        this.restoreData(); //根据this.imageData恢复
        this.dataColor.fill('white'); //所有节点重置染色
        if (this.action) {
          this.action(this.dataColor);
        }
        this.createObjectsList();
      }
    })
  }
  //绑定名单DOM
  bindListDom (dom, arr) {
    this.listDom = dom;
    this.objects = arr; //数据点信息数组
  }
  //绑定反转名单按钮
  bindReverseList (dom) {
    dom.addEventListener('click', e => {
      this.reverseObjectList();
    })
  }
  //创建染色对象名单DOM
  createObjectsList () {
    if (this.listDom == null || this.objects.length ==0) {
      return false;
    }
    let singleArr = new Set(this.allIds);
    singleArr = Array.from(singleArr);
    singleArr.sort((a, b) => a - b); //升序排列结果
    this.listDom.innerHTML = '';
    singleArr.forEach(x => {
      let dom = document.createElement('div');
      dom.classList.add('stain-list-item');
      dom.textContent = x + '  ' + this.objects[x].name;
      this.listDom.appendChild(dom);
    })
  }
  //反转染色对象名单
  reverseObjectList () {
    if (this.objects.length == 0) {
      return false;
    }
    this.listDom.innerHTML = '';
    let singleArr = new Set(this.allIds);
    singleArr = Array.from(singleArr);
    this.objects.forEach(x => {
      if (!singleArr.includes(parseInt(x.number))) {
        let dom = document.createElement('div');
        dom.classList.add('stain-list-item');
        dom.textContent = x.number + '  ' + x.name;
        this.listDom.appendChild(dom);
      }
    })
  }

  //#endregion

  //#region 抽象方法，需要子类自己实现

  //绘制染色区域框选效果
  drawStainArea (area) {}

  //设置染色区域起始位置信息
  setStartOfArea (loc, area) {}
  
  //设置染色区域终止位置信息
  setEndOfArea (loc, area) {}
  
  //计算染色区域内存在活动的数据
  getQualified (scope) {}

  //#endregion
}

class TimeZone extends Stain {
  constructor (id, data, action=null) {
    super(id, data, action);
  }
  //#region 以下四个方法均为父类中抽象方法的实现
  setStartOfArea (loc, area) {
    area.start = loc.x;
  }

  setEndOfArea (loc, area) {
    area.end = loc.x;
  }

  drawStainArea (area) {
    area.color = 'rgba(255,255,0,0.4)'
    this.ctx.fillStyle = area.color;
    this.ctx.fillRect(
      area.start,  //起始x坐标
      0,           //起始y坐标
      area.end - area.start,  //绘制宽度
      this.canvas.clientHeight   //绘制高度
    );
  }

  getQualified (area) {
    const width = this.canvas.clientWidth;
    let   data = this.data;
    let	  start = Math.floor(this.length * (area.start / width));
    let   end   = Math.ceil(this.length * (area.end / width));
    start < end ? true : [start, end] = [end, start]; //确保start<end
    for (let i=0; i<data.length; i++) {
      for (let j=start; j<end; j++) {
        if (data[i][j].x != data[i][j+1].x || data[i][j].y != data[i][j+1].y) {
          this.dataColor[i] = area.color;
          area.ids.push(i);
          break;
        }
      }
    } 
  }
  //#endregion
}

class SpaceZone extends Stain {
  //因为空间域染色要按格绘制框选区域，因此参数多一个step表示格子步长
  constructor (id, data, step=10, action=null) {
    super(id, data, action);
    this.step = step;
  }
  //#region 以下四个方法均为父类中抽象方法的实现
  setStartOfArea (loc, area) {
    area.start = {
      x: loc.x,
      y: loc.y,
    }
  }
  setEndOfArea (loc, area) {
    area.end = {
      x: loc.x,
      y: loc.y,
    }
  }
  drawStainArea (area) {
    area.color = "rgba(0, 0, 255, 0.2)";
    this.ctx.fillStyle = area.color;
    let start = area.start;
    let end   = area.end;
    //减去取余部分，使得绘制距离只能步进，达到按格绘制效果
    start.x = start.x - start.x % this.step;
    start.y = start.y - start.y % this.step;
    end.x   = end.x - end.x % this.step;
    end.y   = end.y - end.y % this.step;
    this.ctx.fillRect(
      start.x,
      start.y,
      end.x - start.x,
      end.y - start.y
    );
  }
  getQualified (area) {
    let start = {
      x: Math.floor(area.start.x / this.step),
      y: Math.floor(area.start.y / this.step)
    }
    let end = {
      x: Math.floor(area.end.x / this.step) - 1,
      y: Math.floor(area.end.y / this.step) - 1,
    }
    start.x <= end.x ? true : [start.x, end.x] = [end.x, start.x];
    start.y <= end.y ? true : [start.y, end.y] = [end.y, start.y];
    let data = this.data;
    for (let i=0; i<data.length; i++) {
      for (let j=0; j<data[i].length; j++) {
        if (data[i][j].x >= start.x && data[i][j].x <= end.x
         && data[i][j].y >= start.y && data[i][j].y <= end.y) {
          this.dataColor[i] = area.color;
          area.ids.push(i);
          break;
        }
      }
    }
  }
}