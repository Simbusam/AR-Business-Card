import { useParams } from 'react-router-dom';

const ARView = () => {
  const { fileName } = useParams();

  return (
    <a-scene embedded vr-mode-ui="enabled: false" arjs="sourceType: webcam; debugUIEnabled: false;">
      <a-entity camera></a-entity>
      <a-entity
        gltf-model={`http://localhost:5000/uploads/${fileName}`}
        scale="0.5 0.5 0.5"
        position="0 0 0"
        rotation="0 180 0"
      ></a-entity>
    </a-scene>
  );
};

export default ARView;