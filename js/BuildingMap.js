class Canvas {
  constructor (id) {
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  //窗口坐标转换为canvas坐标
  windowToCanvas (x, y) {
    let box = this.canvas.getBoundingClientRect();
    //减去border
    return {
      x: x - box.left - (box.width - this.canvas.width)/2 - window.pageXOffset,
      y: y - box.top  - (box.height - this.canvas.height)/2 - window.pageYOffset
    }
  }
  saveData () {
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  restoreData () {
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}

class BuildingMap extends Canvas{
  constructor (id, step=10) {
    super(id);
    this.drawGrid(step+1);
    this.step = step;
    this.start = {}; //染色起始坐标
    this.end = {}; //染色结束坐标
    this.dragStatus = false;  //染色拖动状态
    this.isStainMode = false;  //染色模式是否开启
  }
  //底部网格绘制
  drawGrid (whiteSpace) {
    this.ctx.strokeStyle = 'lightgray';
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    for (let i=0.5; i<=this.canvas.width; i+=whiteSpace) {
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
    }
    this.ctx.stroke();
    this.ctx.beginPath();
    for (let i=0.5; i<=this.canvas.height; i+=whiteSpace) {
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
    }
    this.ctx.stroke();
  }

  //按格绘制
  drawRectGrid (start, end) {  // +1 代表网格线占用的宽度 
    start.x = start.x - start.x % (this.step+1);
    start.y = start.y - start.y % (this.step+1);
    end.x = end.x - end.x % (this.step+1);
    end.y = end.y - end.y % (this.step+1);
    this.ctx.fillRect(start.x, start.y, end.x-start.x, end.y-start.y);
  }
  //从数据绘制地图
  fromData (arr) {
    for (let i=0; i<arr.length; i++){
    //for (let i=arr.length-1; i>=0; i--) {
      for (let j=0; j<arr[i].length; j++) {
        if (arr[i][j] === '1') {
          this.ctx.fillRect((this.step+1)*j + 1, (this.step+1)*i+1, this.step, this.step);
        }
      }
    }
  }
  //绘制圆形点
  drawCircle (x, y, r) {
    let xCor = x*(this.step+1) + 1 + this.step/2;
    let yCor = y*(this.step+1) + 1 + this.step/2;
    this.ctx.beginPath();
    this.ctx.arc(xCor, yCor, r, 0, 2*Math.PI);
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = '2';
    this.ctx.stroke();
    this.ctx.closePath();
  }
  //绘制一帧数据
  drawFrame (dataFrame) {
    this.restoreData();
    dataFrame.forEach(x => {
      this.drawCircle(x.x, x.y, this.step/2 - 1);
    });
  }

  //mousemove悬浮窗
  hoverBox (eX, eY, data) {
    let loc = this.windowToCanvas(eX, eY);
    let personArr = [];
    for (let i=0; i<data.length; i++) {
      let xCor = data[i].x*(this.step+1) + 1 + this.step/2;
      let yCor = data[i].y*(this.step+1) + 1 + this.step/2;
      if (((xCor-loc.x)**2 + (yCor-loc.y)**2) <= (this.step/2 -1)**2) {
        let number = data[i].personNumber;
        personData.forEach(p => {
          if (p.number == number) {
            personArr.push(p.name);
          }
        })
      }
    }
    //显示人名浮动窗
    let popOver = document.getElementsByClassName("popOver")[0];

    //若匹配到则显示悬浮窗，否则隐藏
    if (personArr.length === 0) {
      popOver.style.display = 'none';
    } else {
      let text = personArr.join('<br/>');
      popOver.innerHTML = text;
      popOver.style.display = "block";
    }
    popOver.style.left = eX - window.pageXOffset + 5 +'px';
    popOver.style.top = eY - window.pageYOffset + 5 + 'px';
  }
}