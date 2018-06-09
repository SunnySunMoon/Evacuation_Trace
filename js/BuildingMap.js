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
      x: x - box.left - (box.width - this.canvas.width)/2,
      y: y - box.top  - (box.height - this.canvas.height)/2
    }
  }
  saveData () {
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
}

class BuildingMap extends Canvas{
  constructor (id, step=10) {
    super(id);
    this.drawGrid(step+1);
    this.step = step;
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
  drawRectGrid (start, end) {
    start.x = start.x - start.x % this.step;
    start.y = start.y - start.y % this.step;
    end.x = end.x - end.x % this.step;
    end.y = end.y - end.y % this.step;
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
    //this.ctx.arc(x, y, r, 0, 2*Math.PI);
    this.ctx.fillStyle = 'red';
    this.ctx.fill();
    //this.ctx.endPath();
  }
}