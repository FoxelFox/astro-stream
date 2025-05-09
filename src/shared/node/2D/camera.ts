import {Node2D} from "./node-2d";
import {mat3, Mat3, Mat4, mat4} from "wgpu-matrix";

export class Camera extends Node2D {
	cam: Mat4 = mat4.ortho(-128, 128, -128, 128, 0,1);
}