# Sample react remote input for VEMS getReal3D
This is a sample implementation of a remote input client for the [VEMS extensions for getReal3D](https://github.com/VEMS-ok/gr3d).

This is a react app that is hosted at https://github.com/VEMS-ok/sample-react-remote-input
You can also run this app locally with `npm start` from the project root directory.

When you load the app, you would want to set the protocol, address and port then connect. If connected successfully you should see the `Connection status` set to `connect`.

Currently, the app publishes on the following topics:
- `getReal3D/yawAxis` - Touching/clicking and dragging up and down on the touchpad (blue rectangle space)
- `getReal3D/pitchAxis` - Touching/clicking and dragging left/right on the touchpad
- `getReal3D/wandButtonUp` - Pressing down on the wand button
- `getReal3D/wandButtonDown` - Releasing the wand button

See the documentation of the [getRealRemoteInput](https://vems-ok.github.io/gr3d/classubc_1_1ok_1_1_v_e_m_s_1_1gr3d_1_1get_real_remote_input.html#details) for the list of topics a client could subscribe to by default.
