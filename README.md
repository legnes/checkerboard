# checkerboard
Sometimes I say: "doodling helps me think". Or: "it keeps my hands busy". Does that really explain anything? Truth be told I don't know why I do it, but then again anyone would be hard pressed to come up with a plausible motivation when they notice they've spent the last half an hour filling in the enclosed sections of every a, b, d, g, o, p, q, and R on a page.

I have a few go-to doodles, mostly lettering and patterns. One of them consists of closed shapes superimposed on a checkerboard. The "phase" of the checkerboard pattern (i.e. whether the, say, top left square is black or white) flips across the boundaries defined by the shapes. It looks kind of like this:
![checkerboard 1](https://user-images.githubusercontent.com/1813467/40881743-dbe78696-669c-11e8-880d-7f946f99f807.jpg)
![checkerboard 2](https://user-images.githubusercontent.com/1813467/40881744-dbf54574-669c-11e8-978b-a441cb06b636.jpg)

"Checkerboard" is a webgl take on that doodle. Initially conceived as an excuse to play with full-screen quads, "Checkerboard" grew into a small-scale particle system driven by a physical simulation running on the gpu. The trickiest subsystem to write was probably collision response -- the implementation here is a little hackier than I'd like. I had a blast working out the Runge-Kutta integration and lens optics, but nobody's checked my math, so they could be totally wrong!
