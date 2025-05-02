Content.makeFrontInterface(600, 420);

/* Panel Handling */
const var Ver2Button = Content.getComponent("Ver2Button");
const var Ver1Button = Content.getComponent("Ver1Button");
const var Ver2Panel = Content.getComponent("Ver2Panel");
const var Ver1Panel = Content.getComponent("Ver1Panel");

const var panels = [Ver2Panel, Ver1Panel];

inline function handlePanels(panelToShow)
{
    for(p in panels)
    {
		p.set("visible", panelToShow == p);    
    }
}

Ver2Button.setValue(1);
handlePanels(Ver2Panel);

/* common */
var lowKey = 0;
var hiKey = 127;

Synth.getModulator("VelocityModulator").setBypassed(true);
const var VelocityModulator = Synth.getTableProcessor("VelocityModulator");
const var VelocityModulatorTable = VelocityModulator.getTable(0);
const var InputVelocity = Content.getComponent("InputVelocity");
const var OutputVelocity = Content.getComponent("OutputVelocity");
const var ResetTable = Content.getComponent("ResetTable");
const var LowKey = Content.getComponent("LowKey");
const var HiKey = Content.getComponent("HiKey");

/* Ver2 */
const var ExportBase64 = Content.getComponent("ExportBase64");
const var ImportBase64 = Content.getComponent("ImportBase64");
const var Base64Label  = Content.getComponent("Base64Label");
const var ExportText = Content.getComponent("ExportText");
const var ImportText = Content.getComponent("ImportText");
const var TextLabel2  = Content.getComponent("TextLabel2");

function exportText()
{
	var array = VelocityModulatorTable.getTablePointsAsArray();
	var contents = "";
	var x = 0;
	var y = 0;
	var z = 0;
	for(i = 0; i < array.length; i++)
	{
		x = Math.round(array[i][0]*127);
		y = Math.round(array[i][1]*127);
		z = array[i][2];

//		Console.print("["+x+"]["+y+"]["+z+"]");
		contents += x + "\t" + y + "\t" + z + "\n";	
	}
	TextLabel2.setValue(contents);
}

function importText()
{
	var contents = TextLabel2.getValue();
	var lines = contents.split("\n");
	var x = 0;
	var y = 0;
	var z = 0;
	var array = [[]];
	var point = [];
	if ( lines != NULL )
	{
		array.clear();

		for(i = 0; i < lines.length; i++)
		{
//			Console.print(lines[i]);
			var values = lines[i].split("\t");
			if ( values != NULL)
			{
//				Console.print("0["+values[0].charAt(0)+"]");
				if (values[0] != NULL)
				{
					if (values[0].charAt(0) >= '0' && values[0].charAt(0) <= '9')
					{
//						Console.print("a["+values[0]+"]["+values[1]+"]["+values[2]+"]");
						x = parseInt(values[0],10)/127;

						if (values[1]!= NULL)
							y = parseInt(values[1],10)/127;
						else
							y = 0;

						if (values[2]!= NULL)
							z = values[2];
						else
							z = 0.5;
//						Console.print("b["+x+"]["+y+"]["+z+"]");
						array.push([x,y,z]);
					}
				}
			}
		}
		VelocityModulatorTable.setTablePointsFromArray(array);
	}
}

/* Ver1 */
const var LoadFile = Content.getComponent("LoadFile");
const var SaveFile = Content.getComponent("SaveFile");
const var TextLabel  = Content.getComponent("TextLabel");
const var FileNameLabel  = Content.getComponent("FileNameLabel");
const var FactorSlider = Content.getComponent("Factor");
const var CenterSlider = Content.getComponent("Center");

var filedata = [];

function loadFile(path)
{
	var f = FileSystem.fromAbsolutePath(path);
	if ( f != NULL )
	{
		var contents = f.loadAsString();
		if ( contents != NULL )
		{
			TextLabel.setValue(contents);
			FileNameLabel.setValue(f.toString(0));

			var lines = contents.split("\n");
			if ( lines != NULL )
			{
				filedata[0] = 1;
				for (i = 1; i < 128 ; i++)
				{
					var line = lines[i].trim();
					filedata[i] = parseInt(line,10);
				}
			}
			FactorSlider.setValue(1.0);
			CenterSlider.setValue(64);
			compute();
		}
	}
}

function compute()
{
	var c = CenterSlider.getValue();	
	var f = filedata[c] * FactorSlider.getValue() - filedata[c];
	var r = 0;
	var y = 0;

	if ( filedata[0] == 1 )
	{
		VelocityModulator.reset(0);
		for (i = 1; i < 128 ; i++)
		{
			if (i <= c)
    			r = Math.PI / 2 / (c - 1) * (i - 1);
			else
    			r = Math.PI / 2 + Math.PI / 2 / (127 - c) * (i - c);

			y = Math.floor(filedata[i] + Math.sin(r) * f);
			if (y < 1) y = 1;
			if (y > 127) y = 127;
			VelocityModulatorTable.addTablePoint(i/127, y/127);
		}
		map2text();
	}
}

function map2text()
{
	var contents = TextLabel.getValue();
	var lines = contents.split("\n");
	if ( lines != NULL )
	{
		if (lines[0].trim() != "")
			contents = lines[0].trim() + "\n";
		else
			contents = Engine.getSystemTime(true) + "\n";
	}
	else
		contents = Engine.getSystemTime(true) + "\n";

	for (i = 1; i < 128 ; i++)
	{
		var y = VelocityModulatorTable.getTableValueNormalised((i)/127)*127;				
		contents += Math.round(y) + "\n";
	}
	TextLabel.setValue(contents);
}

loadFile( FileNameLabel.getValue() );
function onNoteOn()
{
	local number = Message.getNoteNumber();
	local velocity = Message.getVelocity();

//	Console.print("number["+number+"]["+lowKey+"]["+ hiKey+"]");

	if ( ( lowKey <= number ) & ( number <= hiKey ) )
	{
		local mappedVelocity = VelocityModulatorTable.getTableValueNormalised(velocity/127)*127;

		InputVelocity.setValue( velocity );
		OutputVelocity.setValue(mappedVelocity);
		Message.setVelocity(mappedVelocity);
	}

	Message.sendToMidiOut();
}
 function onNoteOff()
{
	Message.sendToMidiOut();	
}
 function onController()
{
	Message.sendToMidiOut();
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	switch(number)
	{
		case Ver2Button:
			if ( value > 0 )
				handlePanels(Ver2Panel);
			break;
		case Ver1Button:
			if ( value > 0 )
			{
				if ( FileNameLabel.getValue() == "")
					map2text();
				else
					compute();

				handlePanels(Ver1Panel);
			}
			break;
		case LowKey:
			lowKey = LowKey.getValue();
			break;
		case HiKey:
			hiKey = HiKey.getValue();
			break;
		case InputVelocity:
			OutputVelocity.setValue(VelocityModulatorTable.getTableValueNormalised(value/127)*127);
			break;
		case ResetTable:
			if ( value < 1 )
				VelocityModulator.reset(0);
			break;
		case ExportBase64:
			if ( value < 1 )
				Base64Label.setValue(VelocityModulator.exportAsBase64(0));
			break;
		case ImportBase64:
			if ( value < 1 )
				VelocityModulator.restoreFromBase64(0,Base64Label.getValue());
			break;
		case ExportText:
			if ( value < 1 )
				exportText();
			break;
		case ImportText:
			if ( value < 1 )
				importText();
			break;
		case LoadFile:
			if ( value < 1 )
			{
				FileSystem.browse("", false, "*.txt", function(f){
					loadFile( f.toString(0) );
				});
			}
			break;
		case SaveFile:
			if ( value < 1 )
			{
				FileSystem.browse("", true, "*.txt", function(f){
					var contents =TextLabel.getValue();
					f.writeString(contents);
				});
			}
			break;
		case FactorSlider:
			compute();
			break;
		case CenterSlider:
			compute();
			break;
	}
}
 