import { useEffect, useState } from "react"
import Adonis3d from './Adonis3d-logo.png'

//global values:
let pivotLength = 0;
let radiansB = 0;
let sinB = 0;
let radiansC = 0;
let cosB = 0;
let toolPlusPivot = 0;
let radius = 0;
let zHeightModifier = 0;
let zRangeModifier = 0;
let zActualRange = 0;
let sinC = 0;
let cosC = 0;
let xAxisModifier = 0;
let yAxisModifier = 0;

const presetToolsLength = {
  PivotLength: '8.4423',
  T1: '10.99268',
  T2: '3.62343',
  T3: '4.275',
  T4: '4.555',
  T5: '10.79236',
  T6: '3.79933',
  T7: '6.00305',
  T8: '10.3547',
  T9: '6.07825',
  T10: '10.76285',
  T11: '4.75697',
  T12: '0',
};

const presetAxisRanges = {
  B: { min: '-118', max: '118' },
  C: { min: '-5', max: '365' },
  X: { min: '-38.575', max: '38.575' },
  Y: { min: '-37.775', max: '37.775' },
  Z: { min: '0', max: '36.3' },
};

function App() {
  const [fileContent, setFileContent] = useState('');
  const [finalDisplay, setFinalDisplay] = useState('');
  const [axisRanges, setAxisRanges] = useState();
  const [tools, setTools] = useState();
  const [isDebugMode, setIsDebugMode] = useState();

  useEffect(() => {
    if (!tools?.PivotLength) {
      var toolLengthsData = localStorage.getItem('ToolLengths');
      var savedToolLengths = toolLengthsData ? JSON.parse(toolLengthsData) : {};
      if (toolLengthsData) {
        setTools({
          PivotLength: savedToolLengths.PivotLength,
          T1: savedToolLengths.T1,
          T2: savedToolLengths.T2,
          T3: savedToolLengths.T3,
          T4: savedToolLengths.T4,
          T5: savedToolLengths.T5,
          T6: savedToolLengths.T6,
          T7: savedToolLengths.T7,
          T8: savedToolLengths.T8,
          T9: savedToolLengths.T9,
          T10: savedToolLengths.T10,
          T11: savedToolLengths.T11,
          T12: savedToolLengths.T12,
        });
      } else {
        setTools(presetToolsLength);
        localStorage.setItem('ToolLengths', JSON.stringify(presetToolsLength));
      }

      var axisRangesData = localStorage.getItem('AxisRanges');
      var savedAxisRangesData = axisRangesData ? JSON.parse(axisRangesData) : {};
      if (axisRangesData) {
        setAxisRanges({
          'B': { min: savedAxisRangesData.B.min, max: savedAxisRangesData.B.max },
          'C': { min: savedAxisRangesData.C.min, max: savedAxisRangesData.C.max },
          'X': { min: savedAxisRangesData.X.min, max: savedAxisRangesData.X.max },
          'Y': { min: savedAxisRangesData.Y.min, max: savedAxisRangesData.Y.max },
          'Z': { min: savedAxisRangesData.Z.min, max: savedAxisRangesData.Z.max },
        });
      } else {
        setAxisRanges(presetAxisRanges);
        localStorage.setItem('AxisRanges', JSON.stringify(presetAxisRanges));
      }
    }
  }, []);

  const handleToolsDataEntry = (event) => {
    let newData = tools ? { ...tools } : undefined;
    if (newData) {
      const target = event.target;
      const value = Number(target.value);
      const name = target.name;
      newData = { ...newData, [name]: value };
      if (value) {
        setTools(newData);
        localStorage.setItem('ToolLengths', JSON.stringify(newData));
      }
    }
  }

  const handleAxisDataEntry = (event, axis, minOrMax) => {
    let newData = axisRanges ? { ...axisRanges } : undefined;
    if (newData) {
      let newAxis = newData[axis];
      if (minOrMax === "min") {
        newAxis.min = event.target.value;
      } else {
        newAxis.max = event.target.value;
      }
      newData = { ...newData, [axis]: newAxis };
      setAxisRanges(newData);
      localStorage.setItem('AxisRanges', JSON.stringify(newData));
    }
  }

  function parseGCode(text) {
    let currentPath = ""
    let pointer = 1
    let line = ""
    let index = 1
    const lines = text.split('\n')
    let reportDisplay = ""
    let toolLength = '0'
    let bValue = '0'
    let cValue = '0'

    let currentTool = ""
    let toolNumber = '0'
    let modifiers = { x: 0, y: 0, z: 0 }

    while (pointer < lines.length && index < 20000000) {
      line = lines[pointer++]
      index++
      if (line.indexOf('TOOL DIA') > -1) {
        line = lines[pointer++]
        //index = 0
        currentTool = line.trim()
        toolNumber = currentTool.substring(1)
        if (tools) {
          bValue = '0'
          cValue = '0'
          toolLength = tools ? tools[currentTool] : '0'
          reportDisplay += `<div style="color: green">Tool Change: ${currentTool}</div>`
          if (!toolNumber || Number(toolNumber) > 12) reportDisplay += `<div style="color: green">Tool number error: ${toolNumber || 'BLANK'}</div>`
          reportDisplay += recalculateModifiersAndAxisErrorChecking(bValue, cValue, toolLength)
        }
        reportDisplay += recalculateModifiersAndAxisErrorChecking(bValue, cValue, toolLength,)
      } else if (line.indexOf('Tool Path-') > -1) {
        currentPath = line.substring(line.indexOf('-') + 2)
        reportDisplay += `<div style="font-weight: bold">Tool Path: ${currentPath}</div>`
      } else if (line.indexOf(';') === 0) { //This needs to come after TOOL DIA and Tool Path since those start with a ; but we need to pick them up still.
        //do nothing. This is a commented line. 
      } else if (line.indexOf('B') > -1 || line.indexOf('C') > -1) {
        if (line.indexOf('B') > -1) {
          let temp = line.substring(line.indexOf('B') + 1)
          bValue = String(parseFloat(temp))
          const bMax = axisRanges && axisRanges.B.max
          const bMin = axisRanges && axisRanges.B.min
          if (bMax && Number(bValue) > Number(bMax)) {
            reportDisplay += `<div style="color: red">Error for B on line ${pointer} above maximum, ${bValue}</div>`
          }
          if (bMin && Number(bValue) < Number(bMin)) {
            reportDisplay += `<div style="color: red">Error for B on line ${pointer} below minimum, ${bValue}</div>`
          }
        }
        if (line.indexOf('C') > -1) {
          let temp = line.substring(line.indexOf('C') + 1)
          cValue = String(parseFloat(temp))
          const cMax = axisRanges && axisRanges.C.max
          const cMin = axisRanges && axisRanges.C.min
          if (cMax && Number(cValue) > Number(cMax)) {
            reportDisplay += `<div style="color: red">Error for C on line ${pointer} above maximum, ${cValue}</div>`
          }
          if (cMin && Number(cValue) < Number(cMin)) {
            reportDisplay += `<div style="color: red">Error for C on line ${pointer} below minimum, ${cValue}</div>`
          }
        }
        if (isDebugMode) reportDisplay += `<div style="color: orange">LINE: ${pointer} -- ${line}: xAxisModifier ${xAxisModifier} ^ yAxisModifier ${yAxisModifier} </div>`
        reportDisplay += recalculateModifiersAndAxisErrorChecking(bValue, cValue, toolLength,)
      } else if (line.indexOf('G') === 0 || line.indexOf('X') === 0 || line.indexOf('Y') === 0 || line.indexOf('Z') === 0) {
        const axis = line.split(' ')
        axis.forEach(xyz => {
          const axis = xyz[0]
          if (axis.indexOf('X') === 0 || axis.indexOf('Y') === 0 || axis.indexOf('Z') === 0) {
            let value = parseFloat(xyz.substring(1))
            if (axis.indexOf('X') === 0) {
              value = value + xAxisModifier
            } else if (axis.indexOf('Y') === 0) {
              value = value + yAxisModifier
            } else if (axis.indexOf('Z') === 0) {
              //value = value + zHeightModifier  //Removed during zActualRange change of the code.
              value = value
            }
            // Apply modifiers and perform checks here
            if (axis.indexOf('Z') === 0) {
              if (axisRanges && value < Number(axisRanges[axis].min)) {
                reportDisplay += `<div style="color: red">Error for ${axis} on line ${pointer} below minimum - table collision: ${line}</div>`
              } else if ((axisRanges && value > zActualRange)) {
                reportDisplay += `<div style="color: red">Error for ${axis} on line ${pointer} above maximum - Z height overrun: ${line}</div>`
              }
            } else if ((axisRanges && value < Number(axisRanges[axis].min)) || (axisRanges && value > Number(axisRanges[axis].max))) {
              reportDisplay += `<div style="color: red">Error for ${axis} on line ${pointer}: ${line}</div>`
            }
          }
        })
        if (isDebugMode) reportDisplay += `<div style="color: orange">LINE: ${pointer} -- ${line}: xAxisModifier ${xAxisModifier} ^ yAxisModifier ${yAxisModifier} </div>`
      }
      setFinalDisplay(reportDisplay)
    }
  }

  const recalculateModifiersAndAxisErrorChecking = (bValue, cValue, toolLength) => {
    var displayReturn = ""
    radiansB = Number(bValue) * Math.PI / 180
    sinB = Math.sin(radiansB)
    cosB = Math.cos(radiansB)
    pivotLength = tools ? Number(tools.PivotLength) : 0
    if (pivotLength === 0) displayReturn += `<div style="color: orange">PivotLength is Zero!</div>`
    toolPlusPivot = Number(toolLength) + pivotLength
    radius = sinB * toolPlusPivot
    zHeightModifier = cosB * toolPlusPivot
    zRangeModifier = toolPlusPivot - zHeightModifier
    zActualRange = Number(axisRanges?.Z.max) - Number(toolLength) + zRangeModifier
    radiansC = Number(cValue) * Math.PI / 180
    sinC = Math.sin(radiansC)
    cosC = Math.cos(radiansC)
    let roundedCosC = Math.round(radius * cosC * 10000) / 10000
    if (roundedCosC === -0 || roundedCosC === 0) {
      xAxisModifier = 0
    } else {
      xAxisModifier = radius * cosC
    }
    let roundedSinC = Math.round(radius * sinC * 10000) / 10000
    if (roundedSinC === -0 || roundedSinC === 0) {
      yAxisModifier = 0
    } else {
      yAxisModifier = radius * sinC
    }

    return displayReturn
  }

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      setFileContent(text);
      parseGCode(text);
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <img src={Adonis3d} style={{ height: '80px', width: 'auto', alignSelf: 'center', flex: '0 0 auto' }} alt='Adonis bronze logo' />
      Five Axis Calculation Error Checking
      <div> Note:  This can only be used during 3+2 Machining. This will not work with arc fitted Toolpaths.</div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <div>
            <input id="debugMode" type="checkbox" checked={isDebugMode} onClick={() => setIsDebugMode(!isDebugMode)} />
            <label htmlFor={'debugMode'}>Debug Mode</label>
          </div>
          <input type="file" onChange={(event) => handleFileChange(event)} accept=".txt" style={{ marginTop: '30px', width: '500px' }} />
          <div>
            <div dangerouslySetInnerHTML={{ __html: finalDisplay }} />
          </div>
        </div>
        <div>
          <div className="form-check my-auto mt-n2 mb-2">
            <label className="form-check-label small my-auto" htmlFor="futureDates">
              Pivot Length
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="PivotLength"
              value={tools?.PivotLength}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T1:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T1"
              value={tools?.T1}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T2:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T2"
              value={tools?.T2}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T3:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T3"
              value={tools?.T3}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T4:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T4"
              value={tools?.T4}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T5:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T5"
              value={tools?.T5}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T6:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T6"
              value={tools?.T6}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T7:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T7"
              value={tools?.T7}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T8:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T8"
              value={tools?.T8}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T9:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T9"
              value={tools?.T9}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T10:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T10"
              value={tools?.T10}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T11:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T11"
              value={tools?.T11}
              onChange={handleToolsDataEntry}
            />
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small my-auto me-1" htmlFor="futureDates">
              T12:
            </label>
            <input
              type="number"
              min="-999999"
              className="form-control form-control-sm"
              style={{ width: 'auto' }}
              name="T12"
              value={tools?.T12}
              onChange={handleToolsDataEntry}
            />
          </div>
          <hr />
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small mt-4 me-2" htmlFor="futureDates">
              B-axis:
            </label>
            <div>
              <div>min</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Bmin"
                value={axisRanges?.B.min}
                onChange={(event) => handleAxisDataEntry(event, 'B', 'min')}
              />
            </div>
            <div>
              <div>max</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Bmax"
                value={axisRanges?.B.max || ''}
                onChange={(event) => handleAxisDataEntry(event, 'B', 'max')}
              />
            </div>
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small mt-4 me-2" htmlFor="futureDates">
              C-axis:
            </label>
            <div>
              <div>min</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Cmin"
                value={axisRanges?.C.min || ''}
                onChange={(event) => handleAxisDataEntry(event, 'C', 'min')}
              />
            </div>
            <div>
              <div>max</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Cmax"
                value={axisRanges?.C.max || ''}
                onChange={(event) => handleAxisDataEntry(event, 'C', 'max')}
              />
            </div>
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small mt-4 me-2" htmlFor="futureDates">
              X-axis:
            </label>
            <div>
              <div>min</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Xmin"
                value={axisRanges?.X.min || '' || ''}
                onChange={(event) => handleAxisDataEntry(event, 'X', 'min')}
              />
            </div>
            <div>
              <div>max</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Xmax"
                value={axisRanges?.X.max || ''}
                onChange={(event) => handleAxisDataEntry(event, 'X', 'max')}
              />
            </div>
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small mt-4 me-2" htmlFor="futureDates">
              Y-axis:
            </label>
            <div>
              <div>min</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Ymin"
                value={axisRanges?.Y.min || ''}
                onChange={(event) => handleAxisDataEntry(event, 'Y', 'min')}
              />
            </div>
            <div>
              <div>max</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Ymax"
                value={axisRanges?.Y.max || ''}
                onChange={(event) => handleAxisDataEntry(event, 'Y', 'max')}
              />
            </div>
          </div>
          <div className="form-check my-auto mt-n2 d-flex mb-2">
            <label className="form-check-label small mt-4 me-2" htmlFor="futureDates">
              Z-axis:
            </label>
            <div>
              <div>min</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Zmin"
                value={axisRanges?.Z.min}
                onChange={(event) => handleAxisDataEntry(event, 'Z', 'min')}
              />
            </div>
            <div>
              <div>max</div>
              <input
                type="number"
                min="-999999"
                className="form-control form-control-sm"
                style={{ width: 'auto' }}
                name="Zmax"
                value={axisRanges?.Z.max}
                onChange={(event) => handleAxisDataEntry(event, 'Z', 'max')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
