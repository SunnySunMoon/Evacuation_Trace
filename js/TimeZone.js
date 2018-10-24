class TimeZone extends Canvas {
  constructor (id, data, action=null) {
    super(id);
    this.data = data;
    this.action = action; //未知的数据操作函数
    this.length = data[0].length; //总帧数 
    this.isStainMode = false; //染色开关
    this.dragStatus = false;  //拖拽状态
    this.stainArea = [];  //用于存储染色区域对象
    this.dataColor = new Array(data.length) .fill('white');
    this.allIds = [];  //记录所有染色区域中存在的对象的唯一标识，存在重复情况
    this.listDom = null; //用于显示染色对象的DOM，默认没有
    this.objects = []; //记录染色对象信息

    this.canvas.addEventListener('mousedown', e => {
      if (this.isStainMode) {
        this.dragStatus = true;
        this.statusArr.push(this.saveData());
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        let area = {
          start: loc.x,
          end: undefined,
          color: 'rgba(255,255,0,0.4)',
          ids: [], //保存染色人员序号，或其他数据
        }
        this.stainArea.push(area);
      }
    });
    this.canvas.addEventListener('mousemove', e => {
      if (this.isStainMode && this.dragStatus) {
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        let area = this.stainArea[this.stainArea.length - 1];
        area.end = loc.x
        this.restoreData();
        this.drawRect(area);
      }
    });
    this.canvas.addEventListener('mouseup', e => {
      //监听抬起鼠标事件并对数据点染色
      this.stainDataPoints();
    });
    this.canvas.addEventListener('mouseout', e => {
      //如果是拖动状态，则结束拖动并对数据点染色
      if (this.dragStatus === true) {
        this.stainDataPoints();
        this.dragStatus = false;
      }
    })
  }

  //绘制染色区域
  drawRect (area) {
    this.ctx.fillStyle = area.color;
    this.ctx.fillRect(area.start, 0, area.end-area.start, this.canvas.clientHeight);
  }
  //染色按钮绑定事件
  bindStain (id) {
    const stain = document.getElementById(id);
    stain.addEventListener('click', e => {
      this.isStainMode = true;
      this.canvas.style.display = 'block';
      this.canvas.style.zIndex = '2';  //置于滑动条上层
    });
  } 
  //退出染色mode绑定事件
  bindExit (id) {
    const exit = document.getElementById(id);
    exit.addEventListener('click', e => {
      this.isStainMode = false;
      if(this.stainArea.length == 0) {
        this.canvas.style.display = 'none'; //若一个染色区也不存在，则整个隐藏
      }
      this.canvas.style.zIndex = '-1';  //置于滑动条下层
    });
  }
  //撤销按钮绑定事件
  bindUndo (id) {
    const undo = document.getElementById(id);
    undo.addEventListener('click', e => {
      const data = this.statusArr.pop();
      if (data != undefined) {
        this.imageData = data;
        this.restoreData();
        //其它响应操作
        const ids = this.stainArea.pop().ids;
        ids.forEach(x => {
          const idx = this.allIds.indexOf(x);
          this.allIds.splice(idx, 1);  //删除一次
          if (!this.allIds.includes(x)) {
            //确定该号码不在其它区域存在
            this.dataColor[x] = 'white';
          }
        });
        //存在操作函数
        if (this.action) {
          this.action(this.dataColor); //重新绘制
        }
        this.createObjectsList();
      }
    });
  }
  //清空按钮绑定
  bindEmpty (id) {
    const empty = document.getElementById(id);
    empty.addEventListener('click', e => {
      const data = this.statusArr[0];
      this.statusArr = [];
      this.stainArea = [];
      this.imageData = data;
      if (data != undefined) {
        this.restoreData();
        this.dataColor.fill('white');
        this.allIds = [];
        if (this.action) {
          this.action(this.dataColor);
        }
        this.createObjectsList();
      }
    })
  }

  //绑定名单展示区域
  bindListDom (dom, arr) {
    this.listDom = dom;
    this.objects = arr;
  }

  //计算染色时间段存在活动的数据
  getMoved (scope) {
    const width = this.canvas.clientWidth;
    const data = this.data;
    let start = Math.floor(this.length * (scope.start / width));
    let end   = Math.ceil(this.length * (scope.end / width));
    start < end ? true : [start,end] = [end, start]; //确保start在end前
    for (let i=0; i<data.length; i++) {
      for (let j=start; j<end; j++) {
        if (data[i][j].x != data[i][j+1].x || data[i][j].y != data[i][j+1].y) {
          this.dataColor[i] = scope.color;
          scope.ids.push(i);
          break;
        }
      }
    }
  }

  //染色操作
  stainDataPoints () {
    const scope = this.stainArea[this.stainArea.length-1];
    this.getMoved(scope);
    //判断数据操作函数是否存在，执行
    if (this.action) {
      this.action(this.dataColor);
      this.allIds = this.allIds.concat(scope.ids);
    }
    this.createObjectsList();
  }

  //创建染色对象名单DOM
  createObjectsList () {
    if (this.listDom==null || this.objects.length==0) {
      return false;
    }
    let singleArr = new Set(this.allIds);
    singleArr = Array.from(singleArr);
    this.listDom.innerHTML = "";
    singleArr.forEach(x => {
      let dom = document.createElement('div');
      dom.classList.add('stain-list-item');
      dom.textContent = x + '  ' + this.objects[x].name;
      this.listDom.appendChild(dom);
    })
  }
}

