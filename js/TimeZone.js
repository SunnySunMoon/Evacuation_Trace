class TimeZone extends Canvas {
  constructor (id, length = 100) {
    super(id);
    this.length = length; //总帧数
    this.step = (this.canvas.clientWidth/length).toFixed(1); //单位长度
    this.isStainMode = false; //染色开关
    this.dragStatus = false;  //拖拽状态
    this.stainArea = [];  //用于存储染色区域对象

    this.canvas.addEventListener('mousedown', e => {
      if (this.isStainMode) {
        this.dragStatus = true;
        this.statusArr.push(this.saveData());
        console.log(e.clientX, e.clientY, e);
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        let area = {
          start: Math.floor(loc.x /this.step),
          end: undefined,
          color: 'yellow',
          num: [], //保存染色人员序号，或其他数据
        }
        this.stainArea.push(area);
      }
    });
    this.canvas.addEventListener('mousemove', e => {
      if (this.isStainMode && this.dragStatus) {
        let loc = this.windowToCanvas(e.pageX, e.pageY);
        let area = this.stainArea[this.stainArea.length - 1];
        area.end = Math.floor(loc.x / this.step);
        this.restoreData();
        this.drawRect(area);
      }
    });
  }

  //绘制染色区域
  drawRect (area) {
    this.ctx.fillStyle = area.color;
    this.ctx.fillRect(area.start, 0, area.end-area.start, this.canvas.clientHeight);
  }
}