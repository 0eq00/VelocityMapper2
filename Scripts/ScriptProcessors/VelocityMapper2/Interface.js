Content.makeFrontInterface(600, 460);

const var OptionButton = Content.getComponent("OptionButton");
const var MainPanel = Content.getComponent("MainPanel");
const var OptionPanel = Content.getComponent("OptionPanel");
OptionButton.setValue(0);
MainPanel.set("visible",true);
OptionPanel.set("visible",false);

const var PresetButton = Content.getComponent("PresetButton");
const var PresetBrowser = Content.getComponent("PresetBrowser");
PresetButton.setValue(0);
PresetBrowser.set("visible",false);

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

const var ExportBase64 = Content.getComponent("ExportBase64");
const var ImportBase64 = Content.getComponent("ImportBase64");
const var Base64Label  = Content.getComponent("Base64Label");
const var ExportText = Content.getComponent("ExportText");
const var ImportText = Content.getComponent("ImportText");
const var TextLabel  = Content.getComponent("TextLabel");
const var AdjustSlider = Content.getComponent("AdjustSlider");
AdjustSlider.setValue(1);

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
	TextLabel.setValue(contents);
}

function importText()
{
	var contents = TextLabel.getValue();
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

function adjust()
{
	importText();

	var c = 64;
	var f = VelocityModulatorTable.getTableValueNormalised(c/127)*127;
	var f = f * AdjustSlider.getValue() - f;
	var r = 0;
	var x = 0;
	var y = 0;
	var z = 0;

	var adjusted = [127];
	for (i = 1; i < 128 ; i++)
	{
		if (i <= c)
    		r = Math.PI / 2 / (c - 1) * (i - 1);
		else
    		r = Math.PI / 2 + Math.PI / 2 / (127 - c) * (i - c);

		y = VelocityModulatorTable.getTableValueNormalised(i/127)*127;
		y = Math.floor(y + Math.sin(r) * f);
		if (y < 1) y = 1;
		if (y > 127) y = 127;

		adjusted[i] = Math.round(y);
	}

	var array = VelocityModulatorTable.getTablePointsAsArray();
	if (array != NULL)
	{
		for(i = 0; i < array.length; i++)
		{
			x = Math.round(array[i][0]*127);
			if ( x > 0 )
			{
				y = adjusted[x];
				z = array[i][2];

				array[i][1] = y/127;
//				Console.print("["+x+"]["+y+"]["+z+"]");
			}
		}
		VelocityModulatorTable.setTablePointsFromArray(array);
	}
}

// Soft Pedal
const var CC67Slider = Content.getComponent("CC67Slider");
const var SoftOutSlider = Content.getComponent("SoftOutSlider");
const var SoftPedalButton = Content.getComponent("SoftPedalButton");
const var SoftVelocitySlider = Content.getComponent("SoftVelocitySlider");
const var DiscardCC67Button = Content.getComponent("DiscardCC67Button");

// Sostenuto Pedal
const var CC66Slider = Content.getComponent("CC66Slider");
const var SostenutoPedalButton = Content.getComponent("SostenutoPedalButton");
var keyOn = [];
var sosOn = [];

function initializeSostenuto()
{
	for ( i = 0 ; i < 127 ; i++ )
	{
		keyOn[i] = false;
		sosOn[i] = false;
	}
}
initializeSostenuto();

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

		// Soft Pedal
		if ( SoftPedalButton.getValue() > 0 )
		{
			if ( CC67Slider.getValue() > 64 )
			{
				mappedVelocity = mappedVelocity + SoftVelocitySlider.getValue();
			}
		}
		SoftOutSlider.setValue( mappedVelocity );

		// Sostenuto Pedal
		if ( SostenutoPedalButton.getValue() > 0 )
		{
			keyOn[number] = true;			
		}

		if ( mappedVelocity < 1 )
			mappedVelocity = 1;
		Message.setVelocity(mappedVelocity);
	}

	Message.sendToMidiOut();
}
 function onNoteOff()
{
	// Sostenuto Pedal
	if ( SostenutoPedalButton.getValue() > 0 )
	{
		local number = Message.getNoteNumber();
		keyOn[number] = false;
		
//		Console.print("onNoteOff sosOn["+sosOn[number]+"]");
		if (sosOn[number] == false)
			Message.sendToMidiOut();
		
		Message.ignoreEvent(true);		
	}
	else
		Message.sendToMidiOut();		
}
 function onController()
{
	local number = Message.getControllerNumber();
	local value = Message.getControllerValue();

	// Soft Pedal
	if ( number == 67 )
	{
		CC67Slider.setValue(value);
		if ( DiscardCC67Button.getValue() < 1 )
			Message.sendToMidiOut();
	}
	// Sostenuto Pedal
	else if ( number == 66 )
	{
		CC66Slider.setValue(value);
		if ( SostenutoPedalButton.getValue() > 0 )
		{
			if ( value > 64 )
			{
				for ( i = 0 ; i < 127 ; i++ )
				{
					sosOn[i] = keyOn[i];
				}
			}
			else
			{		
				for ( i = 0 ; i < 127 ; i++ )
				{
					if ( sosOn[i] == true && keyOn[i] == false )
					{
						local myID = Synth.playNote(i, 127);
						Synth.noteOffByEventId(myID);
					}
					sosOn[i] = false;
				}
			}
		}
		else
			Message.sendToMidiOut();
	}
	else
		Message.sendToMidiOut();
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	switch(number)
	{
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
			{
				VelocityModulator.restoreFromBase64(0,Base64Label.getValue());
				AdjustSlider.setValue(1.0);
			}
			break;
		case ExportText:
			if ( value < 1 )
				exportText();
			break;
		case ImportText:
			if ( value < 1 )
			{
				importText();
				AdjustSlider.setValue(1.0);
			}
			break;
		case AdjustSlider:
			adjust();
			break;
		case OptionButton:
			if ( value > 0 )
			{
				OptionPanel.set("visible",true);
				MainPanel.set("visible",false);
			}
			else
			{
				OptionPanel.set("visible",false);
				MainPanel.set("visible",true);
			}
			break;
		case PresetButton:
			if ( value > 0 )
				PresetBrowser.set("visible",true);
			else
				PresetBrowser.set("visible",false);
			break;
		case SostenutoPedalButton:
			initializeSostenuto();
			break;
	}
}
 