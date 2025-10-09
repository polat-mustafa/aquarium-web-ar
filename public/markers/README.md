# AR Markers for Aquarium WebAR

This directory contains AR marker images and QR codes for the aquarium experience.

## QR Code Data Format

Each QR code should contain JSON data in the following format:

```json
{
  "type": "aquarium-creature",
  "markerId": "shark-marker",
  "timestamp": 1640995200000,
  "version": "1.0"
}
```

## Available Markers

- `shark-marker.png` - Great White Shark
- `dolphin-marker.png` - Bottlenose Dolphin
- `turtle-marker.png` - Sea Turtle
- `octopus-marker.png` - Giant Pacific Octopus
- `jellyfish-marker.png` - Moon Jellyfish
- `whale-marker.png` - Humpback Whale

## QR Code Contents

For quick reference, here are the QR code data strings:

### Shark
```
{"type":"aquarium-creature","markerId":"shark-marker","version":"1.0"}
```

### Dolphin
```
{"type":"aquarium-creature","markerId":"dolphin-marker","version":"1.0"}
```

### Turtle
```
{"type":"aquarium-creature","markerId":"turtle-marker","version":"1.0"}
```

### Octopus
```
{"type":"aquarium-creature","markerId":"octopus-marker","version":"1.0"}
```

### Jellyfish
```
{"type":"aquarium-creature","markerId":"jellyfish-marker","version":"1.0"}
```

### Whale
```
{"type":"aquarium-creature","markerId":"whale-marker","version":"1.0"}
```

## Testing URLs

For testing purposes, you can access creatures directly:

- http://localhost:3000/ar?creature=shark-1
- http://localhost:3000/ar?creature=dolphin-1
- http://localhost:3000/ar?creature=turtle-1
- http://localhost:3000/ar?creature=octopus-1
- http://localhost:3000/ar?creature=jellyfish-1
- http://localhost:3000/ar?creature=whale-1