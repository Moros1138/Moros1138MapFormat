// *******************************************************************
// 
// Moros1138's Map Format v1
// 
// What is this?
// 
// This is a custom tilemap format extension for Tiled Map Editor.
// 
// MIT License
//
// Copyright (c) 2020 Moros Smith
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// 
// *******************************************************************


var Moros1138MapFormat = {
    name: "Moros1138's Map Format",
    extension: "mdat",
    
    write: function(map, fileName) {

        var VERSION = 'MOROS1138_MAP_VERSION1';
        var arrBuffer, binaryFile, viewData, index;
        
        // used by setData
        index = 0;

        // *******************************************************************
        //              HELPER FUNCTIONS
        // *******************************************************************

        // isInt(n : Number)
        //
        // return boolean(true) if n is a whole number type
        function isInt(n)
        {
            if(typeof n == 'number')
                return n % 1 === 0;

            return false;
        }

        // setData(d : Array)
        //
        // d[0] : variant data
        // d[1] : string dataType
        //
        // return n/a
        function setData(d)
        {
            if(d[1] == 'word')
            {
                // little endian 2 byte integer
                viewData.setInt16(index, d[0], true);
                index += 2;
            }

            if(d[1] == 'dword')
            {
                // little endian 4 byte integer
                viewData.setInt32(index, d[0], true);
                index += 4;
            }


            if(d[1] == 'float')
            {
                // little endian 4 byte float
                viewData.setFloat32(index, d[0], true);
                index += 4;
            }

            if(d[1] == 'string')
            {
                for(var i = 0; i < d[0].length; i++)
                {
                    viewData.setInt8(index + i, d[0].charCodeAt(i));
                }
                
                index += d[0].length;
            }
        }

        // setString(s : String)
        //
        // return Array
        function setString(s)
        {
            var str = [];

            str.push([s.length, 'word']);
            str.push([s, 'string']);
            
            return str;
        }

        // getSize(arr : Array)
        //
        // return the size of the provided array, in bytes
        function getSize(arr)
        {
            arrSize = new Number(0);

            // cycle through the provided array
            for(var i = 0; i < arr.length; i++)
            {
                // arr[i][0] : variant dataValue
                // arr[i][1] : string dataTYpe

                if(arr[i][1] == 'word')
                {
                    arrSize += 2;
                }

                if(arr[i][1] == 'dword')
                {
                    arrSize += 4;
                }


                if(arr[i][1] == 'float')
                {
                    arrSize += 4;
                }

                if(arr[i][1] == 'string')
                {
                    arrSize += arr[i][0].length;
                }
            }

            return arrSize;
        }

        // setProperties(obj : MapObject)
        //
        // return Array containing the properties of the provided object
        function setProperties(obj)
        {
            var PropertyType = {
                NONE: 0,
                BOOL: 1,
                INT: 2,
                FLOAT: 3,
                STRING: 4
            };

            var props = [];

            props.push([Object.keys(obj.properties()).length, 'word']);

            Object.keys(obj.properties()).forEach(function(prop) {
                
                var val = obj.property(prop),
                    valType = typeof val;

                // property data type and key
                if(valType == 'boolean' || valType == 'number' || valType == 'string')
                {
                    props = props.concat(setString(prop));
                }

                if(valType == 'boolean')
                {
                    props.push([PropertyType.BOOL, 'word']); // bool
                    props.push([val, 'word']);
                }

                if(valType == 'number')
                {
                    if(isInt(val))
                    {
                        props.push([PropertyType.INT, 'word']); // int
                        props.push([val, 'dword']);
                    }
                    else
                    {
                        props.push([PropertyType.FLOAT, 'word']); // float
                        props.push([val, 'float']);
                    }
                }

                if(valType == 'string')
                {
                    props.push([PropertyType.STRING, 'word']); // string
                    props = props.concat(setString(val));
                }
            });

            return props;
        }

        // *******************************************************************
        //              MAP DATA
        // *******************************************************************
        var mapContainer = [];
        mapContainer.push([VERSION, 'string']);
        mapContainer.push([map.width, 'word']);
        mapContainer.push([map.height, 'word']);
        mapContainer.push([map.tileWidth, 'word']);
        mapContainer.push([map.tileHeight, 'word']);
        
        mapContainer.push([map.layerCount, 'word']);

        // *******************************************************************
        //              LAYERS
        // *******************************************************************
        for(var i = 0; i < map.layerCount; i++)
        {
            layer = map.layerAt(i);

            if(layer.isTileLayer || layer.isObjectLayer)
            {
                mapContainer = mapContainer.concat(setString(layer.name));
            }

            // tile layer viewData population
            if(layer.isTileLayer)
            {
                for (y = 0; y < layer.height; y++)
                {
                    for (x = 0; x < layer.width; x++)
                    {
                        mapContainer.push([layer.cellAt(x, y).tileId, 'word']);
                    }
                }
            } // tile layers

            // object layer viewData population
            if(layer.isObjectLayer)
            {
                
                mapContainer.push([layer.objectCount, 'word']);

                for(var i = 0; i < layer.objectCount; i++)
                {
                    var obj = layer.objectAt(i);

                    mapContainer.push([obj.x, 'word']);
                    mapContainer.push([obj.y, 'word']);
                    mapContainer.push([obj.width, 'word']);
                    mapContainer.push([obj.height, 'word']);

                    // obj.name
                    mapContainer = mapContainer.concat(setString(obj.name));

                    // obj.type
                    mapContainer.push([obj.type.length, 'word']);
                    mapContainer.push([obj.type, 'word']);

                    mapContainer.push([obj.shape, 'word']);
                    mapContainer.push([obj.polygon.length, 'word']);

                    for(var j = 0; j < obj.polygon.length; j++)
                    {
                        mapContainer.push([obj.polygon[i].x, 'word']);
                        mapContainer.push([obj.polygon[i].y, 'word']);
                    }

                    // object properites
                    mapContainer = mapContainer.concat(setProperties(obj));
                }
            } // object layers
        } // layer viewData
        
        // *******************************************************************
        //              TILESETS
        // *******************************************************************
        var tilesets = map.usedTilesets();
        
        mapContainer.push([tilesets.length, 'word']);

        for(var i = 0; i < tilesets.length; i++)
        {
            var tileset = tilesets[i];
            var tiles = tileset.tiles;

            mapContainer = mapContainer.concat(setString(tileset.name));

            mapContainer.push([tiles.length, 'word']);
            
            for(var j = 0; j < tiles.length; j++)
            {
                // tile type, if any
                mapContainer = mapContainer.concat(setString(tiles[i].type));
                
                // x and y location of the current tile within the image
                mapContainer.push([(tiles[j].id * tileset.tileWidth) % tileset.imageWidth, 'word']);
                mapContainer.push([Math.floor((tiles[j].id * tileset.tileWidth) / tileset.imageWidth) * tileset.tileHeight, 'word']);
                
                // tile properties
                mapContainer = mapContainer.concat(setProperties(tiles[j]));
            }
            
        } // tilesets
        
        // *******************************************************************
        //              WRITING THE FILE
        // *******************************************************************
        arrBuffer = new ArrayBuffer(getSize(mapContainer));
        binaryFile = new BinaryFile(fileName, BinaryFile.WriteOnly);
        viewData = new DataView(arrBuffer);
        
        // actually set the data
        for(var i = 0; i < mapContainer.length; i++)
        {
            setData(mapContainer[i]);
        }

        // actually write the file
        binaryFile.write(arrBuffer);
        binaryFile.commit();
    },
}

tiled.registerMapFormat("mdat", Moros1138MapFormat);
