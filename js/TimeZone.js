class TimeZone extends Canvas {
  constructor (id, data) {
    super(id);
    this.data = data;
    this.length = data[0].length; //总帧数
    this.isStainMode = false; //染色开关
    this.dragStatus = false;  //拖拽状态
    this.stainArea = [];  //用于存储染色区域对象
    this.peopleColor = new Array(data.length) .fill('white');

    this.canvas.addEventListener('mousedown', e => {
      if (this.isStainMode) {
        this.dragStatus = true;
        this.statusArr.push(this.saveData());
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        let area = {
          start: loc.x,
          end: undefined,
          color: 'rgba(255,255,0,0.4)',
          num: [], //保存染色人员序号，或其他数据
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
      this.dragStatus = false;
      const scope = this.stainArea[this.stainArea.length-1];
      this.getMoved(scope);
      /* 时间染色后主画布相关操作 
      
      
      */

    });
    this.canvas.addEventListener('mouseout', e => {
      this.dragStatus = false;
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
        /*
          其它响应操作
        */ 
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
      }
      /*
        其它响应操作
      */ 
    })
  }

  //计算染色时间段存在活动的数据
  getMoved (scope) {
    const width = this.canvas.clientWidth;
    const data = this.data;
    let start = Math.floor(data[0].length * (scope.start / width));
    let end   = Math.ceil(data[0].length * (scope.end / width));
    start < end ? true : [start,end] = [end, start]; //确保start在end前
    debugger
    for (let i=0; i<data.length; i++) {
      for (let j=start; j<end; j++) {
        if (data[i][j].x != data[i][j+1].x || data[i][j].y != data[i][j+1].y) {
          this.peopleColor[i] = scope.color;
          break;
        }
      }
    }
  }

}

